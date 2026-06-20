import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHip4DashboardData } from "./loris-hip4";

describe("buildHip4DashboardData", () => {
  it("normalizes free Hyperliquid HIP-4 outcome prices for the dashboard", () => {
    const data = buildHip4DashboardData(
      {
        outcomes: [
          {
            outcome: 171,
            name: "Fallback",
            description: "",
            quoteToken: "USDC",
            sideSpecs: [{ name: "Yes" }, { name: "No" }],
          },
          {
            outcome: 172,
            name: "Argentina",
            description: "This outcome resolves to Yes if Argentina wins the 2026 FIFA World Cup.",
            quoteToken: "USDC",
            sideSpecs: [{ name: "Yes" }, { name: "No" }],
          },
        ],
      },
      {
        "#1710": "0.5",
        "#1711": "0.5",
        "#1720": "0.11759",
        "#1721": "0.88241",
      },
    );

    assert.equal(data.source, "Hyperliquid official Info API");
    assert.equal(data.overview.outcomesCount, 2);
    assert.equal(data.overview.pricedSidesCount, 4);
    assert.equal(data.overview.quoteTokensCount, 1);
    assert.equal(data.outcomes[1].outcomeId, 172);
    assert.equal(data.outcomes[1].sides[0].coin, "#1720");
    assert.equal(data.outcomes[1].sides[0].price, 0.11759);
    assert.equal(data.outcomes[1].sides[0].probabilityPct, 11.759);
    assert.equal(data.topYesPrices[0].outcomeId, 171);
    assert.equal(data.topNoPrices[0].outcomeId, 172);
  });
});
