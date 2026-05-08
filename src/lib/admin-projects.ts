import type { Category, ProjectStatus } from "./project-taxonomy";

export type AdminProjectRecord = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  status: ProjectStatus;
  shortDescription: string;
  websiteUrl: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function validateAdminProjectInput(input: {
  name: string;
  slug: string;
  category: string;
  status: string;
  shortDescription: string;
  websiteUrl: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name.trim()) errors.push("项目名必填");
  if (!input.slug.trim()) errors.push("slug 必填");
  if (!input.category.trim()) errors.push("分类必填");
  if (!input.status.trim()) errors.push("状态必填");
  if (!input.shortDescription.trim()) errors.push("一句话简介必填");
  if (!input.websiteUrl.trim()) errors.push("官网链接必填");

  return { valid: errors.length === 0, errors };
}

export function filterAdminProjects(
  projects: AdminProjectRecord[],
  filters: {
    query: string;
    category: Category | "all";
    status: ProjectStatus | "all";
    showDeleted: boolean;
  },
): AdminProjectRecord[] {
  const q = filters.query.trim().toLowerCase();

  return projects.filter((project) => {
    if (filters.showDeleted !== project.isDeleted) {
      return false;
    }

    const categoryMatch = filters.category === "all" || project.category === filters.category;
    const statusMatch = filters.status === "all" || project.status === filters.status;
    const queryMatch =
      q.length === 0 ||
      project.name.toLowerCase().includes(q) ||
      project.slug.toLowerCase().includes(q) ||
      project.shortDescription.toLowerCase().includes(q);

    return categoryMatch && statusMatch && queryMatch;
  });
}

export function softDeleteProject(project: AdminProjectRecord): AdminProjectRecord {
  return { ...project, isDeleted: true, deletedAt: new Date() };
}

export function restoreProject(project: AdminProjectRecord): AdminProjectRecord {
  return { ...project, isDeleted: false, deletedAt: null };
}

export function buildDeleteConfirmationMessage(): string {
  return "删除后该项目前台不再展示，数据不会被永久删除，后台可恢复。";
}
