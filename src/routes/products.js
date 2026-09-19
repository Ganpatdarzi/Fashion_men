const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate, adminOnly } = require("../middleware/auth");

const prisma = new PrismaClient();

// Public: list products with search, filter, sort, pagination
router.get("/", async (req, res, next) => {
  try {
    const { search, category, subcategory, minPrice, maxPrice, brand, material, fit, color, size, sort, page = 1, limit = 12 } = req.query;

    const where = { isActive: true };
    if (search) where.name = { contains: search };
    if (category) where.category = { name: category };
    if (subcategory) where.subcategory = { name: subcategory };
    if (brand) where.brand = brand;
    if (material) where.material = material;
    if (fit) where.fit = fit;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (color) where.variants = { some: { color } };
    if (size) where.variants = { some: { size } };

    let orderBy = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "popular") orderBy = { reviews: { _count: "desc" } };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, variants: true, category: true, subcategory: true },
        orderBy,
        skip,
        take: Number(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
});

// Public: single product
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { images: true, variants: true, category: true, subcategory: true, reviews: { include: { user: { select: { name: true } } } } },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Admin: create product
router.post("/", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, description, price, discount, brand, material, fit, categoryId, subcategoryId, isActive, barcode, variants, images } = req.body;

    const product = await prisma.product.create({
      data: {
        name, description, price: Number(price), discount: Number(discount || 0), brand, material, fit,
        categoryId, subcategoryId,
        barcode: (barcode || "").trim() || null,
        isActive: isActive === undefined ? true : Boolean(isActive),
        variants: variants ? { create: variants.map((v) => ({ ...v, barcode: (v.barcode || "").trim() || null, stock: Number(v.stock) })) } : undefined,
        images: images ? { create: images } : undefined,
      },
      include: { variants: true, images: true },
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// Admin: update product
router.put("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, description, price, discount, brand, material, fit, categoryId, subcategoryId, isActive, barcode, variants } = req.body;
    const productId = Number(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { name, description, price: Number(price), discount: Number(discount || 0), brand, material, fit, categoryId, subcategoryId, isActive, barcode: (barcode || "").trim() || null },
      });

      if (Array.isArray(variants)) {
        for (const v of variants) {
          if (!v || (!v.size && !v.color && !v.id)) continue;
          const vdata = {
            size: v.size,
            color: v.color || "",
            stock: Number(v.stock || 0),
            barcode: (v.barcode || "").trim() || null,
          };
          if (v.id) {
            await tx.productVariant.update({ where: { id: Number(v.id) }, data: vdata });
          } else {
            await tx.productVariant.create({ data: { productId, ...vdata } });
          }
        }
      }
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, images: true, category: true },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Admin: delete product
router.delete("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

// Admin: add variant
router.post("/:id/variants", authenticate, adminOnly, async (req, res, next) => {
  try {
    const variant = await prisma.productVariant.create({
      data: { ...req.body, productId: Number(req.params.id) },
    });
    res.status(201).json(variant);
  } catch (err) {
    next(err);
  }
});

// Admin: update variant stock
router.put("/variants/:variantId", authenticate, adminOnly, async (req, res, next) => {
  try {
    const variant = await prisma.productVariant.update({
      where: { id: Number(req.params.variantId) },
      data: { stock: req.body.stock },
    });
    res.json(variant);
  } catch (err) {
    next(err);
  }
});

// Admin: add image
router.post("/:id/images", authenticate, adminOnly, async (req, res, next) => {
  try {
    const image = await prisma.productImage.create({
      data: { url: req.body.url, isPrimary: req.body.isPrimary || false, productId: Number(req.params.id) },
    });
    res.status(201).json(image);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
