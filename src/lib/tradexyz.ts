const DEFILLAMA_PROTOCOL_URL = "https://api.llama.fi/protocol/tradexyz";
const DEFILLAMA_FEES_URL = "https://api.llama.fi/summary/fees/tradexyz?dataType=dailyFees&excludeTotalDataChartBreakdown=true";
const DEFILLAMA_REVENUE_URL = "https://api.llama.fi/summary/fees/tradexyz?dataType=dailyRevenue&excludeTotalDataChartBreakdown=true";
const FLOWSCAN_PER_DEX_URL = "https://www.flowscan.xyz/api/dex-stats/per-dex";
const HYPEREVM_CHAIN_NAME = "Hyperliquid L1";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/tradexyz-dashboard.json";

type DefiLlamaProtocolResponse = {
  category?: string;
  chain?: string;
  description?: string;
  name?: string;
  twitter?: string;
  url?: string;
};

type DefiLlamaFeesResponse = {
  total24h?: unknown;
  total7d?: unknown;
  total30d?: unknown;
  totalDataChart?: Array<[unknown, unknown]>;
};

type FlowscanPerDexResponse = Record<string, FlowscanDexStats | undefined>;

type FlowscanDexStats = {
  daily_totals?: {
    dates?: unknown[];
    volume?: unknown[];
  };
  markets?: FlowscanDexMarket[];
  total?: {
    oi?: unknown;
    trades?: unknown;
    traders?: unknown;
    volume?: unknown;
  };
};

type FlowscanDexMarket = {
  canonical?: unknown;
  oi?: unknown;
  symbol?: unknown;
  traders?: unknown;
  volume?: unknown;
};

export type TradeXyzFeePoint = {
  date: number;
  fees: number;
};

export type TradeXyzHip3DexComparisonRow = {
  dex: string;
  isTradeXyz: boolean;
  oi: number;
  trades: number;
  traders: number;
  volume: number;
};

export type TradeXyzHip3MarketShareRow = {
  dex: string;
  isTradeXyz: boolean;
  oiPct: number;
  tradesPct: number;
  tradersPct: number;
  volumePct: number;
};

export type TradeXyzPerpVolumePoint = {
  date: number;
  volume: number;
};

export type TradeXyzRevenuePoint = {
  date: number;
  revenue: number;
};

export type TradeXyzTopMarket = {
  canonical: string;
  oi: number;
  rank: number;
  symbol: string;
  traders: number;
  volume: number;
};

export type TradeXyzDashboardData = {
  cacheExpiresAt: string;
  feeHistory: TradeXyzFeePoint[];
  info: {
    category: string;
    chain: string;
    currentFees24h: number;
    currentPerpVolume24h: number;
    currentRevenue24h: number;
    description: string;
    name: string;
    twitter: string;
    url: string;
  };
  hip3DexComparison: TradeXyzHip3DexComparisonRow[];
  hip3MarketShare: TradeXyzHip3MarketShareRow[];
  perpVolumeHistory: TradeXyzPerpVolumePoint[];
  revenueHistory: TradeXyzRevenuePoint[];
  source: string;
  stats: {
    fees7d: number;
    fees30d: number;
    latestDate: number | null;
    revenue7d: number;
    revenue30d: number;
    totalTraders: number;
    volume30d: number;
  };
  topMarkets: TradeXyzTopMarket[];
  updatedAt: string;
};

let cachedDashboardData: { data: TradeXyzDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<TradeXyzDashboardData> | null = null;

function asNumber(value: unknown) {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function cacheExpiresAtMs(data: TradeXyzDashboardData) {
  const expiresAt = new Date(data.cacheExpiresAt).getTime();
  return Number.isFinite(expiresAt) ? expiresAt : 0;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "hyper-evm-hub/1.0",
    },
    next: { revalidate: 3600 },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return (await response.json()) as T;
}

function buildFeeHistory(fees: DefiLlamaFeesResponse): TradeXyzFeePoint[] {
  return [...(fees.totalDataChart ?? [])]
    .map(([date, value]) => ({
      date: asNumber(date),
      fees: asNumber(value),
    }))
    .filter((point) => point.date > 0 && point.fees > 0)
    .sort((a, b) => a.date - b.date);
}

function buildRevenueHistory(revenue: DefiLlamaFeesResponse): TradeXyzRevenuePoint[] {
  return [...(revenue.totalDataChart ?? [])]
    .map(([date, value]) => ({
      date: asNumber(date),
      revenue: asNumber(value),
    }))
    .filter((point) => point.date > 0 && point.revenue > 0)
    .sort((a, b) => a.date - b.date);
}

function dateStringToUnixSeconds(value: unknown) {
  if (typeof value !== "string") return 0;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : 0;
}

function buildPerpVolumeHistory(perDex: FlowscanDexStats): TradeXyzPerpVolumePoint[] {
  const dates = perDex.daily_totals?.dates ?? [];
  const volumes = perDex.daily_totals?.volume ?? [];

  return dates
    .map((date, index) => ({
      date: dateStringToUnixSeconds(date),
      volume: asNumber(volumes[index]),
    }))
    .filter((point) => point.date >= 0 && point.volume > 0)
    .sort((a, b) => a.date - b.date);
}

function rollingVolume(points: TradeXyzPerpVolumePoint[], days: number) {
  return points.slice(-days).reduce((total, point) => total + point.volume, 0);
}

function buildHip3DexComparison(flowscan: FlowscanPerDexResponse): TradeXyzHip3DexComparisonRow[] {
  return Object.entries(flowscan)
    .map(([dex, stats]) => ({
      dex,
      isTradeXyz: dex.toUpperCase() === "XYZ",
      oi: asNumber(stats?.total?.oi),
      trades: asNumber(stats?.total?.trades),
      traders: asNumber(stats?.total?.traders),
      volume: asNumber(stats?.total?.volume),
    }))
    .filter((row) => row.volume > 0 || row.oi > 0 || row.trades > 0 || row.traders > 0)
    .sort((a, b) => b.volume - a.volume);
}

function pct(value: number, total: number) {
  return total > 0 ? Number(((value / total) * 100).toFixed(4)) : 0;
}

function buildHip3MarketShare(rows: TradeXyzHip3DexComparisonRow[]): TradeXyzHip3MarketShareRow[] {
  const totals = rows.reduce(
    (acc, row) => ({
      oi: acc.oi + row.oi,
      trades: acc.trades + row.trades,
      traders: acc.traders + row.traders,
      volume: acc.volume + row.volume,
    }),
    { oi: 0, trades: 0, traders: 0, volume: 0 },
  );

  return rows
    .map((row) => ({
      dex: row.dex,
      isTradeXyz: row.isTradeXyz,
      oiPct: pct(row.oi, totals.oi),
      tradesPct: pct(row.trades, totals.trades),
      tradersPct: pct(row.traders, totals.traders),
      volumePct: pct(row.volume, totals.volume),
    }))
    .sort((a, b) => b.volumePct - a.volumePct);
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildTopMarkets(tradeXyzStats: FlowscanDexStats): TradeXyzTopMarket[] {
  return [...(tradeXyzStats.markets ?? [])]
    .map((market) => {
      const symbol = asText(market.symbol);
      const canonical = asText(market.canonical) || symbol;

      return {
        canonical,
        oi: asNumber(market.oi),
        rank: 0,
        symbol,
        traders: asNumber(market.traders),
        volume: asNumber(market.volume),
      };
    })
    .filter((market) => market.symbol && market.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10)
    .map((market, index) => ({ ...market, rank: index + 1 }));
}

export function buildTradeXyzDashboardData(
  protocol: DefiLlamaProtocolResponse,
  fees: DefiLlamaFeesResponse,
  revenue: DefiLlamaFeesResponse,
  flowscan: FlowscanPerDexResponse = {},
): TradeXyzDashboardData {
  const updatedAt = new Date();
  const feeHistory = buildFeeHistory(fees);
  const revenueHistory = buildRevenueHistory(revenue);
  const tradeXyzStats = flowscan.XYZ ?? {};
  const perpVolumeHistory = buildPerpVolumeHistory(tradeXyzStats);
  const hip3DexComparison = buildHip3DexComparison(flowscan);
  const hip3MarketShare = buildHip3MarketShare(hip3DexComparison);
  const topMarkets = buildTopMarkets(tradeXyzStats);
  const latestDate = feeHistory.at(-1)?.date ?? perpVolumeHistory.at(-1)?.date ?? revenueHistory.at(-1)?.date ?? null;

  return {
    cacheExpiresAt: new Date(updatedAt.getTime() + DASHBOARD_CACHE_MS).toISOString(),
    feeHistory,
    info: {
      category: protocol.category ?? "Interface",
      chain: protocol.chain ?? HYPEREVM_CHAIN_NAME,
      currentFees24h: asNumber(fees.total24h) || feeHistory.at(-1)?.fees || 0,
      currentPerpVolume24h: perpVolumeHistory.at(-1)?.volume || 0,
      currentRevenue24h: asNumber(revenue.total24h) || revenueHistory.at(-1)?.revenue || 0,
      description: protocol.description ?? "",
      name: protocol.name ?? "tradeXYZ",
      twitter: protocol.twitter ?? "",
      url: protocol.url ?? "https://app.trade.xyz/",
    },
    hip3DexComparison,
    hip3MarketShare,
    perpVolumeHistory,
    revenueHistory,
    source: "DefiLlama protocol, fees, and revenue APIs + Flowscan HIP-3 per-dex stats",
    stats: {
      fees7d: asNumber(fees.total7d),
      fees30d: asNumber(fees.total30d),
      latestDate,
      revenue7d: asNumber(revenue.total7d),
      revenue30d: asNumber(revenue.total30d),
      totalTraders: asNumber(tradeXyzStats.total?.traders),
      volume30d: rollingVolume(perpVolumeHistory, 30),
    },
    topMarkets,
    updatedAt: updatedAt.toISOString(),
  };
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as TradeXyzDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (
      !Array.isArray(data.feeHistory) ||
      !Array.isArray(data.hip3DexComparison) ||
      !Array.isArray(data.hip3MarketShare) ||
      !Array.isArray(data.perpVolumeHistory) ||
      !Array.isArray(data.revenueHistory) ||
      !Array.isArray(data.topMarkets) ||
      typeof data.stats?.totalTraders !== "number" ||
      expiresAt <= 0
    ) {
      return null;
    }

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: TradeXyzDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write tradeXYZ dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function refreshTradeXyzDashboardData(signal?: AbortSignal) {
  const [protocol, fees, revenue, flowscan] = await Promise.all([
    fetchJson<DefiLlamaProtocolResponse>(DEFILLAMA_PROTOCOL_URL, signal),
    fetchJson<DefiLlamaFeesResponse>(DEFILLAMA_FEES_URL, signal),
    fetchJson<DefiLlamaFeesResponse>(DEFILLAMA_REVENUE_URL, signal),
    fetchJson<FlowscanPerDexResponse>(FLOWSCAN_PER_DEX_URL, signal),
  ]);
  const data = buildTradeXyzDashboardData(protocol, fees, revenue, flowscan);
  cachedDashboardData = { data, expiresAt: cacheExpiresAtMs(data) };
  await writeDashboardDataToDisk(data);
  return data;
}

export async function getTradeXyzDashboardData() {
  const now = Date.now();

  if (cachedDashboardData && cachedDashboardData.expiresAt > now) {
    return cachedDashboardData.data;
  }

  const diskData = await readDashboardDataFromDisk();
  if (diskData && diskData.expiresAt > now) {
    cachedDashboardData = diskData;
    return diskData.data;
  }

  if (!pendingDashboardData) {
    pendingDashboardData = refreshTradeXyzDashboardData().finally(() => {
      pendingDashboardData = null;
    });
  }

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (diskData) {
      console.warn(`Returning stale tradeXYZ dashboard data after refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      return diskData.data;
    }

    throw error;
  }
}
