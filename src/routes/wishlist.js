const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const prisma = new PrismaClient();

// Get wishlist
router.get("/", authenticate, async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { images: true, variants: true } } },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Add to wishlist
router.post("/add", authenticate, async (req, res, next) => {
  try {
    const { productId } = req.body;
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      create: { userId: req.user.id, productId },
      update: {},
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// Remove from wishlist
router.delete("/:productId", authenticate, async (req, res, next) => {
  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: req.user.id, productId: Number(req.params.productId) } },
    });
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
