import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DASHBOARD_NAV_ITEMS, SIDEBAR_BRAND_NAME, SIDEBAR_CATEGORIES } from "./sidebar-config";

describe("sidebar config", () => {
  it("keeps the HyperEVM ecosystem category set", () => {
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

  it("keeps the sidebar brand name as HyperEVM Hub", () => {
    assert.equal(SIDEBAR_BRAND_NAME, "HyperEVM Hub");
  });

  it("exposes the Hyperliquid dashboard navigation items", () => {
    assert.deepEqual(DASHBOARD_NAV_ITEMS, [
      { label: "HYPE ETF", href: "/dashboard/hype-etf" },
      { label: "HYPE 回购", href: "/dashboard/hype-buyback" },
      { label: "HyperEVM TVL 排行", href: "/dashboard/hyperevm-tvl" },
      { label: "HIP-3 数据面板", href: "/dashboard/hip-3" },
      { label: "HIP-4 数据面板", href: "/dashboard/hip-4" },
    ]);
  });
});
