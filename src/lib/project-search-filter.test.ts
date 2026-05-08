import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyProjectDirectoryQuery, clearDirectoryFilters, type DirectoryFilterState } from "./project-search-filter";
import type { DirectoryProject } from "./project-directory";

const projects: DirectoryProject[] = [
  {
    id: "1", name: "Alpha Lend", slug: "alpha-lend", category: "DeFi", status: "Live",
    shortDescription: "借贷协议", logoFile: null, logoUrl: null, websiteUrl: "https://a.com",
    twitterUrl: null, discordUrl: null, docsUrl: null,
    createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-03"),
  },
  {
    id: "2", name: "Beta Dex", slug: "beta-dex", category: "DEX", status: "Beta",
    shortDescription: "交易聚合", logoFile: null, logoUrl: null, websiteUrl: "https://b.com",
    twitterUrl: null, discordUrl: null, docsUrl: null,
    createdAt: new Date("2026-01-02"), updatedAt: new Date("2026-01-04"),
  },
];

describe("search and filter", () => {
  it("搜索大小写不敏感且部分匹配", () => {
    const state: DirectoryFilterState = { query: "beta", category: "all", status: "all", tags: [], sort: "name-asc" };
    const result = applyProjectDirectoryQuery(projects, state, { "1": ["借贷"], "2": ["交易", "聚合"] }, { "1": "Alpha long", "2": "DEX long desc" });
    assert.deepEqual(result.map((p) => p.name), ["Beta Dex"]);
  });

  it("清除筛选恢复默认状态", () => {
    const cleared = clearDirectoryFilters();
    assert.deepEqual(cleared, { query: "", category: "all", status: "all", tags: [], sort: "name-asc" });
  });
});
