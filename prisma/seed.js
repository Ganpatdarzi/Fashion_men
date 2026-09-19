require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@fashion.com" },
    update: {},
    create: { name: "Admin", email: "admin@fashion.com", password: adminPassword, role: "admin" },
  });

  // Create test customer
  const customerPassword = await bcrypt.hash("customer123", 10);
  await prisma.user.upsert({
    where: { email: "customer@fashion.com" },
    update: {},
    create: { name: "John Doe", email: "customer@fashion.com", password: customerPassword, phone: "1234567890" },
  });

  // Categories
  const categories = [
    {
      name: "Shirts",
      subcategories: ["Formal Shirts", "Casual Shirts", "Checked Shirts", "Printed Shirts", "Denim Shirts", "Linen Shirts"],
    },
    {
      name: "T-Shirts",
      subcategories: ["Round Neck", "V-Neck", "Polo", "Oversized", "Graphic", "Plain"],
    },
    {
      name: "Jeans",
      subcategories: ["Skinny Fit", "Slim Fit", "Straight Fit", "Regular Fit", "Baggy", "Distressed"],
    },
    {
      name: "Pants",
      subcategories: ["Casual Pants", "Cargo Pants", "Slim Fit Pants", "Wide Leg Pants"],
    },
    {
      name: "Trousers",
      subcategories: ["Formal Trousers", "Slim Fit Trousers", "Chinos", "Pleated Trousers"],
    },
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });

    for (const sub of cat.subcategories) {
      const existing = await prisma.subcategory.findFirst({ where: { name: sub, categoryId: category.id } });
      if (!existing) {
        await prisma.subcategory.create({ data: { name: sub, categoryId: category.id } });
      }
    }
  }

  // Sample products
  const shirtCategory = await prisma.category.findUnique({ where: { name: "Shirts" } });
  const formalShirt = await prisma.subcategory.findFirst({ where: { name: "Formal Shirts" } });

  const existingShirt = await prisma.product.findUnique({ where: { barcode: "8900000000101" } });
  if (!existingShirt) {
    await prisma.product.create({
    data: {
      name: "Classic White Formal Shirt",
      description: "A premium cotton formal shirt perfect for office and special occasions. Made with 100% organic cotton.",
      price: 1299,
      discount: 10,
      barcode: "8900000000101",
      brand: "FashionMen",
      material: "Cotton",
      fit: "Regular Fit",
      categoryId: shirtCategory.id,
      subcategoryId: formalShirt?.id,
      variants: {
        create: [
          { size: "S", color: "White", stock: 20, barcode: "8900000000102" },
          { size: "M", color: "White", stock: 30, barcode: "8900000000103" },
          { size: "L", color: "White", stock: 25, barcode: "8900000000104" },
          { size: "XL", color: "White", stock: 15, barcode: "8900000000105" },
          { size: "M", color: "Light Blue", stock: 20, barcode: "8900000000106" },
          { size: "L", color: "Light Blue", stock: 20, barcode: "8900000000107" },
        ],
      },
      images: {
        create: [{ url: "/uploads/shirt-white-1.jpg", isPrimary: true }],
      },
    },
  });
  }

  const tshirtCategory = await prisma.category.findUnique({ where: { name: "T-Shirts" } });
  const existingPolo = await prisma.product.findUnique({ where: { barcode: "8900000000201" } });
  if (!existingPolo) {
  await prisma.product.create({
    data: {
      name: "Premium Cotton Polo T-Shirt",
      description: "A comfortable polo t-shirt made with breathable cotton. Perfect for casual outings.",
      price: 799,
      discount: 0,
      barcode: "8900000000201",
      brand: "FashionMen",
      material: "Cotton",
      fit: "Regular Fit",
      categoryId: tshirtCategory.id,
      variants: {
        create: [
          { size: "M", color: "Black", stock: 40, barcode: "8900000000202" },
          { size: "L", color: "Black", stock: 35, barcode: "8900000000203" },
          { size: "XL", color: "Black", stock: 20, barcode: "8900000000204" },
          { size: "M", color: "Navy", stock: 30, barcode: "8900000000205" },
          { size: "L", color: "Navy", stock: 25, barcode: "8900000000206" },
        ],
      },
      images: {
        create: [{ url: "/uploads/polo-black-1.jpg", isPrimary: true }],
      },
    },
  });
  }

  const jeansCategory = await prisma.category.findUnique({ where: { name: "Jeans" } });
  const existingJeans = await prisma.product.findUnique({ where: { barcode: "8900000000301" } });
  if (!existingJeans) {
  await prisma.product.create({
    data: {
      name: "Slim Fit Stretch Jeans",
      description: "Modern slim fit jeans with stretch fabric for comfort. Dark wash with subtle fading.",
      price: 1599,
      discount: 15,
      barcode: "8900000000301",
      brand: "FashionMen",
      material: "Denim",
      fit: "Slim Fit",
      categoryId: jeansCategory.id,
      variants: {
        create: [
          { size: "30", color: "Dark Blue", stock: 25, barcode: "8900000000302" },
          { size: "32", color: "Dark Blue", stock: 30, barcode: "8900000000303" },
          { size: "34", color: "Dark Blue", stock: 20, barcode: "8900000000304" },
          { size: "32", color: "Black", stock: 15, barcode: "8900000000305" },
        ],
      },
      images: {
        create: [{ url: "/uploads/jeans-slim-1.jpg", isPrimary: true }],
      },
    },
  });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
