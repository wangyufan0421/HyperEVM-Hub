const FLOWSCAN_SNAPSHOT_URL = "https://www.flowscan.xyz/api/dex-stats/snapshot";
const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";

type FlowScanSnapshot = {
  daily_volume?: {
    dates?: unknown[];
    series?: Record<string, unknown[]>;
  };
};

type HyperliquidSpotAssetCtx = {
  circulatingSupply?: unknown;
  coin?: unknown;
  dayNtlVlm?: unknown;
  markPx?: unknown;
  midPx?: unknown;
};

type HyperliquidSpotMetaAndAssetCtxs = [unknown, HyperliquidSpotAssetCtx[]];

export type HomeHipMetrics = {
  hip3Volume24h: number | null;
  hip4MarketSize: number | null;
  hip4Volume24h: number | null;
};

function asFiniteNumber(value: unknown) {
  const numberValue = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function latestHip3DailyVolume(snapshot: FlowScanSnapshot) {
  const dates = snapshot.daily_volume?.dates ?? [];
  const series = snapshot.daily_volume?.series ?? {};
  const latestIndex = dates.length - 1;

  if (latestIndex < 0) return null;

  let hasValue = false;
  const total = Object.values(series).reduce((sum, values) => {
    const value = asFiniteNumber(values[latestIndex]);
    if (value === null) return sum;
    hasValue = true;
    return sum + value;
  }, 0);

  return hasValue ? total : null;
}

function outcomeAssetContexts(spotMetaAndAssetCtxs: HyperliquidSpotMetaAndAssetCtxs | unknown) {
  if (!Array.isArray(spotMetaAndAssetCtxs)) return [];
  const assetCtxs = spotMetaAndAssetCtxs[1];
  if (!Array.isArray(assetCtxs)) return [];

  return assetCtxs.filter((ctx) => typeof ctx?.coin === "string" && ctx.coin.startsWith("#"));
}

export function buildHomeHipMetrics(snapshot: FlowScanSnapshot, spotMetaAndAssetCtxs: HyperliquidSpotMetaAndAssetCtxs | unknown): HomeHipMetrics {
  const outcomeCtxs = outcomeAssetContexts(spotMetaAndAssetCtxs);
  const hip4Volume24h = outcomeCtxs.reduce((sum, ctx) => sum + (asFiniteNumber(ctx.dayNtlVlm) ?? 0), 0);
  const hip4MarketSize = outcomeCtxs.reduce((sum, ctx) => {
    const price = asFiniteNumber(ctx.markPx) ?? asFiniteNumber(ctx.midPx) ?? 0;
    const circulatingSupply = asFiniteNumber(ctx.circulatingSupply) ?? 0;
    return sum + price * circulatingSupply;
  }, 0);

  return {
    hip3Volume24h: latestHip3DailyVolume(snapshot),
    hip4MarketSize: outcomeCtxs.length > 0 ? hip4MarketSize : null,
    hip4Volume24h: outcomeCtxs.length > 0 ? hip4Volume24h : null,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "hyper-evm-hub/1.0",
      ...init?.headers,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getHomeHipMetrics(): Promise<HomeHipMetrics> {
  const [snapshot, spotMetaAndAssetCtxs] = await Promise.all([
    fetchJson<FlowScanSnapshot>(FLOWSCAN_SNAPSHOT_URL, {
      headers: {
        referer: "https://www.flowscan.xyz/hip-3",
      },
    }),
    fetchJson<HyperliquidSpotMetaAndAssetCtxs>(HYPERLIQUID_INFO_URL, {
      body: JSON.stringify({ type: "spotMetaAndAssetCtxs" }),
      method: "POST",
    }),
  ]);

  return buildHomeHipMetrics(snapshot, spotMetaAndAssetCtxs);
}
