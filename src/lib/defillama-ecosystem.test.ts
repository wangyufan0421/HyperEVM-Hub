import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractHyperEvmMetrics } from "./defillama-ecosystem";

describe("extractHyperEvmMetrics", () => {
  it("separates chain fees and revenue from app fees and revenue", () => {
    const metrics = extractHyperEvmMetrics({
      feesOverview: {
        protocols: [
          {
            name: "Hyperliquid L1",
            protocolType: "chain",
            total24h: 100,
          },
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 25,
          },
          {
            name: "App B",
            protocolType: "protocol",
            total24h: 75,
          },
        ],
      },
      revenueOverview: {
        protocols: [
          {
            name: "Hyperliquid L1",
            protocolType: "chain",
            total24h: 40,
          },
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 8,
          },
          {
            name: "App B",
            protocolType: "protocol",
            total24h: 12,
          },
        ],
      },
      dexOverview: {
        total24h: 5000,
      },
      dexChainOverviews: {
        Base: { total24h: 3500 },
        Ethereum: { total24h: 4000 },
        "Hyperliquid L1": { total24h: 3200 },
        Polygon: { total24h: 3000 },
        Solana: { total24h: 5000 },
      },
      globalDexOverview: {
        allChains: ["Solana", "Ethereum", "Base", "Polygon", "Hyperliquid L1"],
      },
    });

    assert.equal(metrics.chainFees24h, 100);
    assert.equal(metrics.chainRevenue24h, 40);
    assert.equal(metrics.appFees24h, 100);
    assert.equal(metrics.appRevenue24h, 20);
    assert.equal(metrics.dexVolume24h, 5000);
    assert.equal(metrics.hyperliquidDexRank, 4);
    assert.deepEqual(metrics.dexChainRankings, [
      { isHyperliquid: false, name: "Solana", rank: 1, volume24h: 5000 },
      { isHyperliquid: false, name: "Ethereum", rank: 2, volume24h: 4000 },
      { isHyperliquid: false, name: "Base", rank: 3, volume24h: 3500 },
      { isHyperliquid: true, name: "Hyperliquid L1", rank: 4, volume24h: 3200 },
      { isHyperliquid: false, name: "Polygon", rank: 5, volume24h: 3000 },
    ]);
  });

  it("falls back to overview totals when a chain row is missing", () => {
    const metrics = extractHyperEvmMetrics({
      feesOverview: {
        total24h: 300,
        protocols: [
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 25,
          },
        ],
      },
      revenueOverview: {
        total24h: 120,
        protocols: [
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 12,
          },
        ],
      },
      dexOverview: {},
    });

    assert.equal(metrics.chainFees24h, 300);
    assert.equal(metrics.chainRevenue24h, 120);
    assert.equal(metrics.appFees24h, 25);
    assert.equal(metrics.appRevenue24h, 12);
    assert.equal(metrics.dexVolume24h, null);
    assert.equal(metrics.hyperliquidDexRank, null);
    assert.deepEqual(metrics.dexChainRankings, []);
  });
});
