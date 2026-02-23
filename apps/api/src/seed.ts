import { PrismaClient } from "@repo/database/src/generated/global-client";
import * as bcrypt from "bcrypt";

async function main() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    const email = process.env.GLOBAL_ADMIN_EMAIL || "admin@platform.com";
    const password = process.env.GLOBAL_ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.globalUser.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`Global admin already exists: ${email}`);
      return;
    }

    await prisma.globalUser.create({
      data: {
        email,
        password: hashedPassword,
        name: "Platform Admin",
        role: "GLOBAL_ADMIN",
      },
    });

    console.log(`Global admin created: ${email}`);

    const defaultPlan = await prisma.plan.findUnique({
      where: { name: "Basic" },
    });

    if (!defaultPlan) {
      await prisma.plan.create({
        data: {
          name: "Basic",
          price: 0,
          maxProducts: 100,
          maxUsers: 5,
        },
      });
      console.log("Default 'Basic' plan created");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
