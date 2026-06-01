import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findBestProjectSearchMatch,
  getCategoryCounts,
  getDirectoryEmptyState,
  sortDirectoryProjects,
  type DirectoryProject,
} from "./project-directory";

const projects: DirectoryProject[] = [
  {
    id: "1",
    name: "Beta",
    slug: "beta",
    category: "DEX",
    categories: ["DEX", "DeFi"],
    status: "Beta",
    shortDescription: "beta desc",
    logoFile: null,
    logoUrl: null,
    websiteUrl: "https://example.com",
    twitterUrl: null,
    discordUrl: null,
    docsUrl: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-05T00:00:00.000Z"),
  },
  {
    id: "2",
    name: "Alpha",
    slug: "alpha",
    category: "DeFi",
    categories: ["DeFi"],
    status: "Live",
    shortDescription: "alpha desc",
    logoFile: null,
    logoUrl: null,
    websiteUrl: "https://example.org",
    twitterUrl: null,
    discordUrl: null,
    docsUrl: null,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  },
];

describe("project directory helpers", () => {
  it("sorts by project name A-Z by default", () => {
    const sorted = sortDirectoryProjects(projects, "name-asc");
    assert.deepEqual(
      sorted.map((item) => item.name),
      ["Alpha", "Beta"],
    );
  });

  it("sorts by newest created first", () => {
    const sorted = sortDirectoryProjects(projects, "created-desc");
    assert.deepEqual(
      sorted.map((item) => item.name),
      ["Alpha", "Beta"],
    );
  });

  it("sorts by recently updated first", () => {
    const sorted = sortDirectoryProjects(projects, "updated-desc");
    assert.deepEqual(
      sorted.map((item) => item.name),
      ["Alpha", "Beta"],
    );
  });

  it("counts projects by category", () => {
    const counts = getCategoryCounts(projects);
    assert.equal(counts.DeFi, 2);
    assert.equal(counts.DEX, 1);
  });

  it("returns the no projects empty state", () => {
    const state = getDirectoryEmptyState([], false);
    assert.equal(state, "no-projects");
  });

  it("returns the no results empty state", () => {
    const state = getDirectoryEmptyState([], true);
    assert.equal(state, "no-results");
  });

  it("finds an exact project match by name or slug", () => {
    assert.equal(findBestProjectSearchMatch(projects, "alpha")?.slug, "alpha");
    assert.equal(findBestProjectSearchMatch(projects, "BETA")?.slug, "beta");
  });

  it("finds a single partial project match but ignores ambiguous partial matches", () => {
    assert.equal(findBestProjectSearchMatch(projects, "alp")?.slug, "alpha");
    assert.equal(findBestProjectSearchMatch(projects, "a"), null);
  });
});
