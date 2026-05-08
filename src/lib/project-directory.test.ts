import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
  it("默认按名称 A-Z 排序", () => {
    const sorted = sortDirectoryProjects(projects, "name-asc");
    assert.deepEqual(
      sorted.map((item) => item.name),
      ["Alpha", "Beta"],
    );
  });

  it("支持按最新添加排序", () => {
    const sorted = sortDirectoryProjects(projects, "created-desc");
    assert.deepEqual(
      sorted.map((item) => item.name),
      ["Alpha", "Beta"],
    );
  });

  it("支持按最近更新排序", () => {
    const sorted = sortDirectoryProjects(projects, "updated-desc");
    assert.deepEqual(
      sorted.map((item) => item.name),
      ["Alpha", "Beta"],
    );
  });

  it("可统计分类项目数量", () => {
    const counts = getCategoryCounts(projects);
    assert.equal(counts.DeFi, 2);
    assert.equal(counts.DEX, 1);
  });

  it("无项目时返回无项目空状态", () => {
    const state = getDirectoryEmptyState([], false);
    assert.equal(state, "no-projects");
  });

  it("筛选无结果时返回无结果空状态", () => {
    const state = getDirectoryEmptyState([], true);
    assert.equal(state, "no-results");
  });
});
