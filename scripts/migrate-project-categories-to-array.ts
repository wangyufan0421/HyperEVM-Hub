import { PrismaClient } from "@prisma/client";
import { mapCategoryToV2OrInfra } from "../src/lib/project-taxonomy";
import { parseProjectList, serializeProjectList } from "../src/lib/admin-projects-service";

const prisma = new PrismaClient();

async function main() {
  const projects = (await prisma.project.findMany()) as Array<{
    id: string;
    name: string;
    category: string | null;
    categories?: unknown;
  }>;

  let updated = 0;
  let skipped = 0;
  let unrecognized = 0;

  for (const project of projects) {
    const existingCategories = parseProjectList(project.categories);
    if (existingCategories.length > 0) {
      skipped += 1;
      continue;
    }

    const mapped = mapCategoryToV2OrInfra(project.category ?? "");
    if (!project.category || project.category !== mapped) {
      unrecognized += project.category ? 0 : 1;
    }

    await (prisma.project as unknown as {
      update: (args: {
        where: { id: string };
        data: { category: string; categories: string };
      }) => Promise<unknown>;
    }).update({
      where: { id: project.id },
      data: {
        category: mapped,
        categories: serializeProjectList([mapped]),
      },
    });

    updated += 1;
  }

  console.log("=== categories array migration summary ===");
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
