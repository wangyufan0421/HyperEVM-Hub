import { sortDirectoryProjects, type DirectoryProject, type ProjectSort } from "./project-directory";
import type { Category, ProjectStatus } from "./project-taxonomy";

export type DirectoryFilterState = {
  query: string;
  category: Category | "all";
  status: ProjectStatus | "all";
  tags: string[];
  sort: ProjectSort;
};

export function clearDirectoryFilters(): DirectoryFilterState {
  return {
    query: "",
    category: "all",
    status: "all",
    tags: [],
    sort: "name-asc",
  };
}

export function applyProjectDirectoryQuery(
  projects: DirectoryProject[],
  state: DirectoryFilterState,
  tagsByProjectId: Record<string, string[]>,
  longDescriptionByProjectId: Record<string, string>,
): DirectoryProject[] {
  const q = state.query.trim().toLowerCase();

  const filtered = projects.filter((project) => {
    const projectTags = tagsByProjectId[project.id] ?? [];
    const longDescription = longDescriptionByProjectId[project.id] ?? "";

    const categoryMatch = state.category === "all" || project.category === state.category;
    const statusMatch = state.status === "all" || project.status === state.status;
    const tagsMatch = state.tags.length === 0 || state.tags.every((tag) => projectTags.includes(tag));

    const queryMatch =
      q.length === 0 ||
      project.name.toLowerCase().includes(q) ||
      project.shortDescription.toLowerCase().includes(q) ||
      longDescription.toLowerCase().includes(q) ||
      project.category.toLowerCase().includes(q) ||
      projectTags.some((tag) => tag.toLowerCase().includes(q));

    return categoryMatch && statusMatch && tagsMatch && queryMatch;
  });

  return sortDirectoryProjects(filtered, state.sort);
}
