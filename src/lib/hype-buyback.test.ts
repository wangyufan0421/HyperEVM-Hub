import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHypeBuybackDashboardData } from "./hype-buyback";

describe("buildHypeBuybackDashboardData", () => {
  it("normalizes HYPE buyback rows and totals", () => {
    const data = buildHypeBuybackDashboardData([
      { d: "2026-01-02", h: 20, u: 200, a: 10, p: 11 },
      { d: "2026-01-01", h: 10, u: 90, a: 9, p: 9.5 },
    ]);

    assert.equal(data.rows.length, 2);
    assert.equal(data.rows[0].date, "2026-01-01");
    assert.equal(data.rows[0].cumulativeHype, 10);
    assert.equal(data.rows[1].cumulativeHype, 30);
    assert.equal(data.rows[1].cumulativeUsd, 290);
    assert.equal(data.totals.latestDate, "2026-01-02");
    assert.equal(data.totals.latestUsd, 200);
    assert.equal(data.totals.cumulativeHype, 30);
    assert.equal(data.totals.cumulativeUsd, 290);
    assert.equal(data.totals.averageDailyUsd, 145);
    assert.equal(data.totals.maxDailyUsd, 200);
    assert.ok(Date.parse(data.cacheExpiresAt) > Date.parse(data.updatedAt));
  });
});
