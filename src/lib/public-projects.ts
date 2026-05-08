import type { Project } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizeProjectRecord } from "./admin-projects-service";

export type PublicProject = Omit<Project, "tags" | "coreFeatures" | "targetUsers" | "riskNotes"> & {
  tags: string[];
  coreFeatures: string[];
  targetUsers: string[];
  riskNotes: string[];
  categories: string[];
};

export async function listPublicProjects() {
  const projects = await prisma.project.findMany({
    where: { isDeleted: false },
    orderBy: [{ name: "asc" }],
  });

  return projects.map((project) => normalizeProjectRecord(project) as unknown as PublicProject);
}

export async function getPublicProjectBySlug(slug: string) {
  return normalizeProjectRecord(await prisma.project.findFirst({
    where: { slug, isDeleted: false },
  })) as unknown as PublicProject | null;
}
