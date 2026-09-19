const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const prisma = new PrismaClient();

// Get addresses
router.get("/", authenticate, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

// Add address
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { label, street, city, state, zip, country, isDefault } = req.body;
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const address = await prisma.address.create({
      data: { userId: req.user.id, label, street, city, state, zip, country, isDefault },
    });
    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
});

// Update address
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { label, street, city, state, zip, country, isDefault } = req.body;
    const address = await prisma.address.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const updated = await prisma.address.update({
      where: { id: address.id },
      data: { label, street, city, state, zip, country, isDefault },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete address
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });
    await prisma.address.delete({ where: { id: address.id } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
