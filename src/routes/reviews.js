const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { notify } = require("../utils/notify");

const prisma = new PrismaClient();

// Get reviews for a product
router.get("/product/:productId", async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: Number(req.params.productId) },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// Add review
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = await prisma.review.create({
      data: { userId: req.user.id, productId, rating, comment },
      include: { user: { select: { id: true, name: true } } },
    });

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      select: { name: true },
    });
    notify("review", `New ${rating}-star review on "${product?.name || "product"}"`, "/admin/reviews");

    res.status(201).json(review);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "You already reviewed this product" });
    }
    next(err);
  }
});

// Delete review (own or admin)
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: Number(req.params.id) } });
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    await prisma.review.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
