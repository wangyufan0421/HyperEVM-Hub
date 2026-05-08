import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SIDEBAR_CATEGORIES, SIDEBAR_BRAND_NAME } from "./sidebar-config";

describe("sidebar config", () => {
  it("仅包含新分类集合", () => {
    assert.deepEqual(SIDEBAR_CATEGORIES, [
      "DeFi",
      "DEX",
      "Bridge",
      "NFT",
      "Wallet",
      "Infra",
      "Stable",
      "HIP-3",
      "HIP-4",
    ]);
  });

  it("品牌名称保持 HyperEVM Hub", () => {
    assert.equal(SIDEBAR_BRAND_NAME, "HyperEVM Hub");
  });
});
