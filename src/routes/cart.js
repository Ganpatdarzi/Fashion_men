const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const prisma = new PrismaClient();

// Get cart
router.get("/", authenticate, async (req, res, next) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: { include: { images: true } }, variant: true },
        },
      },
    });
    if (!cart) cart = await prisma.cart.create({ data: { userId: req.user.id }, include: { items: true } });

    const total = cart.items.reduce((sum, item) => {
      const price = item.product.price * (1 - item.product.discount / 100);
      return sum + price * item.quantity;
    }, 0);

    res.json({ ...cart, total });
  } catch (err) {
    next(err);
  }
});

// Add to cart
router.post("/add", authenticate, async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const pid = Number(productId);
    const vid = Number(variantId);
    const qty = Number(quantity);
    if (!productId || !variantId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: "productId, variantId and a positive quantity are required" });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: vid },
      include: { product: true },
    });
    if (!variant || variant.productId !== pid) {
      return res.status(400).json({ error: "Invalid product or variant" });
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: req.user.id } });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: pid, variantId: vid },
    });

    const newQty = existing ? existing.quantity + qty : qty;
    if (variant.stock <= 0) {
      return res.status(400).json({ error: `${variant.product.name} (${variant.size}/${variant.color}) is out of stock` });
    }
    if (newQty > variant.stock) {
      return res.status(400).json({ error: `Only ${variant.stock} unit(s) of ${variant.product.name} (${variant.size}/${variant.color}) in stock` });
    }

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId: pid, variantId: vid, quantity: qty } });
    }

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: { include: { images: true } }, variant: true } } },
    });

    const total = updated.items.reduce((sum, item) => {
      const price = item.product.price * (1 - item.product.discount / 100);
      return sum + price * item.quantity;
    }, 0);

    res.json({ ...updated, total });
  } catch (err) {
    next(err);
  }
});

// Update quantity
router.put("/item/:itemId", authenticate, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = await prisma.cartItem.findFirst({
      where: { id: Number(req.params.itemId), cartId: cart.id },
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: "Quantity must be a positive integer" });
      }
      const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (variant && qty > variant.stock) {
        return res.status(400).json({ error: `Only ${variant.stock} unit(s) in stock` });
      }
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
    }
    res.json({ message: "Cart updated" });
  } catch (err) {
    next(err);
  }
});

// Remove from cart
router.delete("/item/:itemId", authenticate, async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = await prisma.cartItem.findFirst({
      where: { id: Number(req.params.itemId), cartId: cart.id },
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json({ message: "Item removed" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
