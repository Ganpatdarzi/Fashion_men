const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function notify(type, message, link) {
  try {
    await prisma.adminNotification.create({ data: { type, message, link } });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
}

module.exports = { notify };