import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHyperEvmTvlDashboardData } from "./defillama-hyperevm-tvl";

describe("buildHyperEvmTvlDashboardData", () => {
  it("normalizes top HyperEVM TVL protocols with fee metrics", () => {
    const data = buildHyperEvmTvlDashboardData(
      [
        {
          name: "Project A",
          slug: "project-a",
          category: "Dexs",
          logo: "a.png",
          chains: ["Hyperliquid L1"],
          chainTvls: { "Hyperliquid L1": 1000 },
          parentProtocol: "parent#project",
        },
        {
          name: "Project B Vault",
          slug: "project-b",
          category: "Lending",
          logo: "b.png",
          chains: ["Ethereum", "Hyperliquid L1"],
          chainTvls: { "Hyperliquid L1": 2000 },
          parentProtocol: "parent#project",
        },
        {
          name: "Project C",
          slug: "project-c",
          category: "Bridge",
          logo: "c.png",
          chains: ["Hyperliquid L1"],
          chainTvls: { "Hyperliquid L1": 3000 },
        },
      ],
      {
        "project-a": {
          chainTvls: {
            "Hyperliquid L1": {
              tvl: [
                { date: 1000, totalLiquidityUSD: 500 },
                { date: 1000 + 29 * 86400, totalLiquidityUSD: 800 },
                { date: 1000 + 30 * 86400, totalLiquidityUSD: 1000 },
              ],
            },
          },
        },
        "project-b": {
          chainTvls: {
            "Hyperliquid L1": {
              tvl: [
                { date: 1000, totalLiquidityUSD: 1000 },
                { date: 1000 + 30 * 86400, totalLiquidityUSD: 2000 },
              ],
            },
          },
        },
      },
      {
        protocols: [
          { slug: "project-a", parentProtocol: "parent#project", total24h: 10, total7d: 70, total30d: 300 },
          { slug: "project-b", parentProtocol: "parent#project", total24h: 5, total7d: 20, total30d: 90 },
        ],
      },
      {
        protocols: [
          { slug: "project-a", parentProtocol: "parent#project", total24h: 4, total7d: 10, total30d: 40 },
          { slug: "project-b", parentProtocol: "parent#project", total24h: 6, total7d: 20, total30d: 60 },
        ],
      },
    );

    assert.equal(data.rows.length, 1);
    assert.equal(data.rows[0].slug, "project");
    assert.equal(data.rows[0].name, "Project");
    assert.equal(data.rows[0].rank, 1);
    assert.equal(data.rows[0].currentTvl, 3000);
    assert.equal(data.rows[0].fees24h, 15);
    assert.equal(data.rows[0].revenue24h, 10);
    assert.equal(data.totals.currentTvl, 3000);
    assert.equal(data.totals.revenue24h, 10);
    assert.ok(Date.parse(data.cacheExpiresAt) > Date.parse(data.updatedAt));
  });
});
