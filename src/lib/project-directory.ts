export type DirectoryProject = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categories: string[];
  status: string;
  shortDescription: string;
  logoFile: string | null;
  logoUrl: string | null;
  websiteUrl: string;
  twitterUrl: string | null;
  discordUrl: string | null;
  docsUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectSort = "name-asc" | "created-desc" | "updated-desc";

export function sortDirectoryProjects(
  projects: DirectoryProject[],
  sort: ProjectSort,
): DirectoryProject[] {
  const copied = [...projects];

  if (sort === "created-desc") {
    return copied.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  if (sort === "updated-desc") {
    return copied.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  return copied.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategoryCounts(projects: DirectoryProject[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const project of projects) {
    for (const category of project.categories) {
      counts[category] = (counts[category] ?? 0) + 1;
    }
  }
  return counts;
}

export function getDirectoryEmptyState(
  projects: DirectoryProject[],
  hasActiveFilter: boolean,
): "none" | "no-projects" | "no-results" {
  if (projects.length > 0) {
    return "none";
  }

  if (hasActiveFilter) {
    return "no-results";
  }

  return "no-projects";
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export function findBestProjectSearchMatch(projects: DirectoryProject[], query: string): DirectoryProject | null {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return null;
  }

  const exactMatch = projects.find((project) => {
    return normalizeSearchText(project.name) === normalizedQuery || normalizeSearchText(project.slug) === normalizedQuery;
  });
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatches = projects.filter((project) => normalizeSearchText(project.name).includes(normalizedQuery));
  return partialMatches.length === 1 ? partialMatches[0] : null;
}
