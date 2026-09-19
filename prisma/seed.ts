import bcrypt from "bcryptjs";
import { rawPrisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const organization = await rawPrisma.organization.upsert({
    where: { slug: "demo-gym" },
    update: {},
    create: {
      name: "Demo Gym",
      slug: "demo-gym",
      status: "ACTIVE",
    },
  });

  const branch = await rawPrisma.branch.upsert({
    where: { id: `${organization.id}-main` },
    update: {},
    create: {
      id: `${organization.id}-main`,
      organizationId: organization.id,
      name: "Main Branch",
    },
  });

  await rawPrisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: "owner@demogym.test" } },
    update: {},
    create: {
      organizationId: organization.id,
      branchId: null,
      email: "owner@demogym.test",
      passwordHash,
      name: "Demo Owner",
      role: "OWNER",
      emailVerified: new Date(),
    },
  });

  await rawPrisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: "receptionist@demogym.test" } },
    update: {},
    create: {
      organizationId: organization.id,
      branchId: branch.id,
      email: "receptionist@demogym.test",
      passwordHash,
      name: "Demo Receptionist",
      role: "RECEPTIONIST",
      emailVerified: new Date(),
    },
  });

  console.log("Seeded demo organization:", organization.slug);
  console.log("Login as owner@demogym.test / password123");
  console.log("Login as receptionist@demogym.test / password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await rawPrisma.$disconnect();
  });
