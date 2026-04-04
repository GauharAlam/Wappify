import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "gauharalam1377@gmail.com";
  // The user requested: push this credential in db as a admin email id - gauharalam1377@gmail.com pass 123456
  const password = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: UserRole.ADMIN,
      name: "Super Admin",
    },
    create: {
      email,
      password,
      role: UserRole.ADMIN,
      name: "Super Admin",
    },
  });

  console.log("Admin seeded successfully:", admin.email, " | Role:", admin.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
