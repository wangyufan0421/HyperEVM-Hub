import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATEGORIES,
  CATEGORY_LABELS_ZH,
  PROJECT_STATUS,
  STATUS_LABELS_ZH,
  filterProjects,
  mapLegacyCategoryToV2,
  mapCategoryToV2OrInfra,
  type ProjectFilterInput,
} from "./project-taxonomy";

const items: ProjectFilterInput[] = [
  {
    name: "Alpha DeFi",
    categories: ["DeFi"],
    status: "Live",
  },
  {
    name: "Beta DEX",
    categories: ["DEX", "DeFi"],
    status: "Beta",
  },
  {
    name: "Gamma Bridge",
    categories: ["Bridge"],
    status: "Testnet",
  },
];

describe("project taxonomy and filters", () => {
  it("分类和状态枚举包含新分类", () => {
    assert.deepEqual(CATEGORIES, ["DeFi", "DEX", "Bridge", "NFT", "Wallet", "Infra", "Stable", "HIP-3", "HIP-4"]);
    assert.equal(PROJECT_STATUS.includes("Live"), true);
    assert.equal(PROJECT_STATUS.includes("Inactive"), true);
  });

  it("状态中文映射正确", () => {
    assert.equal(STATUS_LABELS_ZH.Live, "运行中");
    assert.equal(STATUS_LABELS_ZH["Coming Soon"], "即将上线");
  });

  it("分类显示名存在", () => {
    assert.equal(CATEGORY_LABELS_ZH.DeFi, "DeFi");
    assert.equal(CATEGORY_LABELS_ZH["HIP-4"], "HIP-4");
  });

  it("旧分类可映射到新分类", () => {
    assert.equal(mapLegacyCategoryToV2("Lending"), "DeFi");
    assert.equal(mapLegacyCategoryToV2("Cross Chain Bridge"), "Bridge");
    assert.equal(mapLegacyCategoryToV2("Unknown"), null);
    assert.equal(mapCategoryToV2OrInfra("Unknown"), "Infra");
  });

  it("分类筛选为单选", () => {
    const result = filterProjects(items, {
      category: "DEX",
      status: "all",
      query: "",
    });

    assert.deepEqual(
      result.map((item) => item.name),
      ["Beta DEX"],
    );
  });

  it("状态筛选为单选", () => {
    const result = filterProjects(items, {
      category: "all",
      status: "Testnet",
      query: "",
    });

    assert.deepEqual(
      result.map((item) => item.name),
      ["Gamma Bridge"],
    );
  });

  it("分类、状态和关键词筛选可叠加", () => {
    const result = filterProjects(items, {
      category: "DEX",
      status: "Beta",
      query: "beta",
    });

    assert.deepEqual(
      result.map((item) => item.name),
      ["Beta DEX"],
    );
  });
});
