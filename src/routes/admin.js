const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate, adminOnly } = require("../middleware/auth");

const prisma = new PrismaClient();

// Dashboard stats
router.get("/dashboard", authenticate, adminOnly, async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, pendingOrders, salesResult, recentOrders] = await Promise.all([
      prisma.user.count({ where: { role: "customer" } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["Order Placed", "Processing"] } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: "Cancelled" } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalSales: salesResult._sum.totalAmount || 0,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

// Get all orders (admin)
router.get("/orders", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } }, items: true, receipt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Update order status
router.put("/orders/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Get all customers
router.get("/customers", authenticate, adminOnly, async (req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// Get all reviews (admin)
router.get("/reviews", authenticate, adminOnly, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { id: true, name: true } }, product: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// Delete any review (admin)
router.delete("/reviews/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.review.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
});

// Get notifications (admin)
router.get("/notifications", authenticate, adminOnly, async (req, res, next) => {
  try {
    const [items, unread] = await Promise.all([
      prisma.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.adminNotification.count({ where: { read: false } }),
    ]);
    res.json({ items, unread });
  } catch (err) {
    next(err);
  }
});

// Mark one notification read
router.put("/notifications/:id/read", authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.adminNotification.update({ where: { id: Number(req.params.id) }, data: { read: true } });
    res.json({ message: "Marked read" });
  } catch (err) {
    next(err);
  }
});

// Mark all notifications read
router.put("/notifications/read-all", authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.adminNotification.updateMany({ data: { read: true } });
    res.json({ message: "All marked read" });
  } catch (err) {
    next(err);
  }
});

// POS: scan barcode to find product/variant
router.get("/pos/scan/:code", authenticate, adminOnly, async (req, res, next) => {
  try {
    const code = (req.params.code || "").trim();
    if (!code) return res.status(400).json({ error: "Barcode is required" });

    const variant = await prisma.productVariant.findUnique({
      where: { barcode: code },
      include: { product: { include: { images: true, category: true } } },
    });
    if (variant) {
      return res.json({ product: variant.product, variant });
    }

    const product = await prisma.product.findUnique({
      where: { barcode: code },
      include: { variants: true, images: true, category: true },
    });
    if (!product) return res.status(404).json({ error: "Barcode not found" });

    res.json({ product, variant: null });
  } catch (err) {
    next(err);
  }
});

// POS: create in-store order
router.post("/pos/orders", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { customerId, customerName, customerPhone, items, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in sale" });
    }

    let userId;
    if (customerId) {
      const customer = await prisma.user.findUnique({ where: { id: Number(customerId) } });
      if (!customer) return res.status(400).json({ error: "Customer not found" });
      userId = customer.id;
    } else {
      if (!customerName || !customerName.trim()) {
        return res.status(400).json({ error: "Customer name is required" });
      }
      let customer = null;
      if (customerPhone) customer = await prisma.user.findFirst({ where: { phone: customerPhone } });
      if (!customer) {
        const bcrypt = require("bcryptjs");
        customer = await prisma.user.create({
          data: {
            name: customerName.trim(),
            phone: customerPhone || null,
            email: `pos-${Date.now()}@fashion.com`,
            password: await bcrypt.hash("Pos@1234", 10),
          },
        });
      }
      userId = customer.id;
    }

    const variantIds = items.map((i) => Number(i.variantId));
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    let totalAmount = 0;
    for (const item of items) {
      const v = variants.find((x) => x.id === Number(item.variantId));
      if (!v) return res.status(400).json({ error: "Variant not found" });
      if (v.stock < Number(item.quantity)) {
        return res.status(400).json({ error: `Insufficient stock for ${v.product.name} (${v.size}/${v.color})` });
      }
      totalAmount += v.product.price * (1 - v.product.discount / 100) * Number(item.quantity);
    }

    const isCash = paymentMethod === "Cash";
    const pay = isCash ? "POS Cash" : paymentMethod === "Card" ? "POS Card" : "POS Online";
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentMethod: pay,
          deliveryAddress: "In-store purchase (POS)",
          status: isCash ? "Delivered" : "Order Placed",
          paid: isCash,
          items: {
            create: items.map((item) => {
              const v = variants.find((x) => x.id === Number(item.variantId));
              return {
                productId: v.productId,
                variantId: v.id,
                quantity: Number(item.quantity),
                price: v.product.price * (1 - v.product.discount / 100),
              };
            }),
          },
        },
        include: { items: { include: { product: true, variant: true } }, user: { select: { name: true, phone: true } } },
      });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: Number(item.variantId) },
          data: { stock: { decrement: Number(item.quantity) } },
        });
      }
      return o;
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// POS: verify payment received and mark order delivered
router.put("/pos/orders/:id/verify", authenticate, adminOnly, async (req, res, next) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { paid: true, status: "Delivered" },
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
