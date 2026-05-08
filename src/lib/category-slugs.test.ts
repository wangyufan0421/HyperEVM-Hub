import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categoryToSlug, slugToCategory, getCategorySlugEntries, getCategorySlugByCategory, getCategoryDisplayName } from "./category-slugs";

describe("category slugs", () => {
  it("分类 slug 映射稳定", () => {
    assert.equal(categoryToSlug("DEX"), "dex");
    assert.equal(categoryToSlug("HIP-3"), "hip-3");
  });

  it("slug 能反查分类", () => {
    assert.equal(slugToCategory("defi"), "DeFi");
    assert.equal(slugToCategory("bridge"), "Bridge");
  });

  it("非法 slug 返回 null", () => {
    assert.equal(slugToCategory("unknown-category"), null);
  });

  it("分类显示名优先使用新分类显示名", () => {
    assert.equal(getCategoryDisplayName("DEX"), "DEX");
    assert.equal(getCategoryDisplayName("Unknown"), "Infra");
  });

  it("分类 slug entries 保持可反查", () => {
    assert.equal(getCategorySlugByCategory("DeFi"), "defi");
    assert.equal(getCategorySlugEntries().length, 9);
  });
});
