import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPassword@123";
  const adminName = process.env.SEED_ADMIN_NAME || "Admin";

  // 1. Seed Admin
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        username: adminUsername,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Created admin user "${admin.username}" (id: ${admin.id})`);
  } else {
    console.log(`Admin user "${adminUsername}" already exists.`);
  }

  // 2. Seed 3 Salesman / Cashier accounts
  const salesmans = [
    { name: "Sales Counter 1", username: "sales1", password: "Sales1Password@123" },
    { name: "Sales Counter 2", username: "sales2", password: "Sales2Password@123" },
    { name: "Sales Counter 3", username: "sales3", password: "Sales3Password@123" },
  ];

  for (const s of salesmans) {
    const existing = await prisma.user.findUnique({ where: { username: s.username } });
    if (!existing) {
      const passwordHash = await hashPassword(s.password);
      const cashier = await prisma.user.create({
        data: {
          name: s.name,
          username: s.username,
          passwordHash,
          role: "CASHIER",
        },
      });
      console.log(`Created cashier user "${cashier.username}" (id: ${cashier.id})`);
    } else {
      console.log(`Cashier user "${s.username}" already exists.`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
