import assert from "node:assert/strict";
import test from "node:test";
import { TRADE_XYZ_DASHBOARD_COPY } from "./tradexyz-copy";

test("tradeXYZ dashboard copy keeps the project display name", () => {
  assert.equal(TRADE_XYZ_DASHBOARD_COPY.displayName, "tradeXYZ");
  assert.equal(TRADE_XYZ_DASHBOARD_COPY.chartLabel, "tradeXYZ fees and perp volume chart");
});
