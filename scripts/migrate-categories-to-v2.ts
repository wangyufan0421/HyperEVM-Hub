import { PrismaClient } from "@prisma/client";
import { isV2Category, mapLegacyCategoryToV2, mapCategoryToV2OrInfra } from "../src/lib/project-taxonomy";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, category: true },
  });

  let updated = 0;
  let skipped = 0;
  let unrecognized = 0;

  for (const project of projects) {
    const currentCategory = project.category ?? "";

    if (isV2Category(currentCategory)) {
      skipped += 1;
      continue;
    }

    const mapped = mapLegacyCategoryToV2(currentCategory);
    const nextCategory = mapCategoryToV2OrInfra(currentCategory);

    if (!mapped) {
      unrecognized += 1;
      console.log(`[unrecognized] ${project.id} ${project.name}: ${project.category} -> Infra`);
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { category: nextCategory },
    });
    updated += 1;
  }

  console.log("=== category migration summary ===");
  console.log(`updated: ${updated}`);
  console.log(`skipped: ${skipped}`);
  console.log(`unrecognized: ${unrecognized}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
