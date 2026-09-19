const router = require("express").Router();
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { notify } = require("../utils/notify");
const { uploadBuffer } = require("../utils/cloudinary");

const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(file.originalname.split(".").pop().toLowerCase());
    const mime = allowed.test(file.mimetype.split("/")[1]);
    if (ext || mime) return cb(null, true);
    const err = new Error("Only images (jpg/png/gif/webp) and PDFs are allowed");
    err.status = 400;
    cb(err);
  },
});

router.post("/upload", authenticate, upload.single("receipt"), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ error: "Not your order" });

    const result = await uploadBuffer(req.file.buffer, {
      folder: "fashion-men/receipts",
      resourceType: "auto",
    });

    const url = result.secure_url;
    const fileSize = result.bytes;

    const existing = await prisma.paymentReceipt.findUnique({ where: { orderId: order.id } });
    if (existing) {
      if (existing.status === "confirmed") return res.status(400).json({ error: "Payment already confirmed" });
      const updated = await prisma.paymentReceipt.update({
        where: { orderId: order.id },
        data: { url, fileName: req.file.originalname, fileSize, status: "pending", updatedAt: new Date() },
      });
      notify("receipt", `Payment receipt re-uploaded for order #${order.id}`, "/admin/receipts");
      return res.json(updated);
    }

    const receipt = await prisma.paymentReceipt.create({
      data: {
        orderId: order.id,
        url,
        fileName: req.file.originalname,
        fileSize,
        status: "pending",
      },
    });
    notify("receipt", `Payment receipt uploaded for order #${order.id}`, "/admin/receipts");
    res.status(201).json(receipt);
  } catch (err) {
    next(err);
  }
});

router.get("/order/:orderId", authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.orderId) } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const receipt = await prisma.paymentReceipt.findUnique({ where: { orderId: order.id } });
    res.json(receipt || null);
  } catch (err) {
    next(err);
  }
});

router.get("/pending", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const receipts = await prisma.paymentReceipt.findMany({
      include: { order: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(receipts);
  } catch (err) {
    next(err);
  }
});

router.put("/:id/confirm", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { status } = req.body;
    if (!["confirmed", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const receipt = await prisma.paymentReceipt.update({ where: { id: Number(req.params.id) }, data: { status } });
    if (status === "confirmed") {
      await prisma.order.update({ where: { id: receipt.orderId }, data: { status: "Processing" } });
    }
    res.json(receipt);
  } catch (err) {
    next(err);
  }
});

router.get("/download/:id", async (req, res, next) => {
  try {
    const jwt = require("jsonwebtoken");
    const token = req.query.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const receipt = await prisma.paymentReceipt.findUnique({ where: { id: Number(req.params.id) }, include: { order: true } });
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    if (receipt.order.userId !== decoded.id && decoded.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const fileUrl = receipt.url;
    if (/^https?:\/\//.test(fileUrl)) {
      const http = fileUrl.startsWith("https:") ? require("https") : require("http");
      const { URL } = require("url");
      const parsed = new URL(fileUrl);
      res.setHeader("Content-Disposition", `attachment; filename="${receipt.fileName.replace(/"/g, "")}"`);
      http.get(parsed, (stream) => stream.pipe(res));
    } else {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "../../", fileUrl);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
      res.download(filePath, receipt.fileName);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;