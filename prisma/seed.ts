import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// Permission matrix per role
const permissionMatrix = [
  // VIEWER — can only view dashboard
  { role: "VIEWER", resource: "DASHBOARD", actions: ["READ"] },

  // ANALYST — can view records and access dashboard insights
  { role: "ANALYST", resource: "RECORDS",   actions: ["READ"] },
  { role: "ANALYST", resource: "DASHBOARD", actions: ["READ"] },

  // ADMIN — full control over records, users, and dashboard
  { role: "ADMIN", resource: "RECORDS",   actions: ["CREATE", "READ", "UPDATE", "DELETE"] },
  { role: "ADMIN", resource: "USERS",     actions: ["CREATE", "READ", "UPDATE", "DELETE"] },
  { role: "ADMIN", resource: "DASHBOARD", actions: ["READ"] },
] as const;

async function main() {
  const roles = ["ADMIN", "ANALYST", "VIEWER"];

  // Seed roles
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName as any },
      update: {},
      create: {
        name: roleName as any,
        description: `${roleName} role`,
      },
    });
  }

  // Seed permissions
  for (const entry of permissionMatrix) {
    const role = await prisma.role.findUnique({ where: { name: entry.role as any } });
    if (!role) continue;

    for (const action of entry.actions) {
      await prisma.permission.upsert({
        where: {
          roleId_resource_action: {
            roleId: role.id,
            resource: entry.resource as any,
            action: action as any,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          resource: entry.resource as any,
          action: action as any,
        },
      });
    }
  }

  console.log("✅ Roles and permissions seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

