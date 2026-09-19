const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { notify } = require("../utils/notify");

const prisma = new PrismaClient();

// Checkout - create order from cart
router.post("/checkout", authenticate, async (req, res, next) => {
  try {
    const { addressId, paymentMethod = "COD" } = req.body;

    if (!["COD", "Card", "Online"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Validate stock
    for (const item of cart.items) {
      if (item.variant.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.product.name} (${item.variant.size}/${item.variant.color})` });
      }
    }

    // Get delivery address
    const address = await prisma.address.findFirst({
      where: { id: Number(addressId), userId: req.user.id },
    });
    if (!address) return res.status(400).json({ error: "Address not found" });

    const deliveryAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;

    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.product.price * (1 - item.product.discount / 100);
      return sum + price * item.quantity;
    }, 0);

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          totalAmount,
          paymentMethod,
          deliveryAddress,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.product.price * (1 - item.product.discount / 100),
            })),
          },
        },
        include: { items: true },
      });

      // Decrease stock
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    notify("order", `New order #${order.id} placed (${paymentMethod})`, "/admin/orders");

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Get my orders
router.get("/", authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get single order
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: { include: { product: { include: { images: true } }, variant: true } } },
    });
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
