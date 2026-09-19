const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate, adminOnly } = require("../middleware/auth");

const prisma = new PrismaClient();

// Public: get all categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true, _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Public: get single category
router.get("/:id", async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(req.params.id) },
      include: { subcategories: true },
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// Admin: create category
router.post("/", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const category = await prisma.category.create({ data: { name, description, image } });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// Admin: update category
router.put("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: { name, description, image },
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// Admin: delete category
router.delete("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

// Admin: create subcategory
router.post("/:id/subcategories", authenticate, adminOnly, async (req, res, next) => {
  try {
    const sub = await prisma.subcategory.create({
      data: { name: req.body.name, categoryId: Number(req.params.id) },
    });
    res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
});

// Admin: delete subcategory
router.delete("/:id/subcategories/:subId", authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.subcategory.delete({ where: { id: Number(req.params.subId) } });
    res.json({ message: "Subcategory deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
