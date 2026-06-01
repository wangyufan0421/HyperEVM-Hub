const FLOWSCAN_BASE_URL = "https://www.flowscan.xyz";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;

type SeriesMap = Record<string, unknown[]>;

type FlowScanSnapshot = {
  overview?: {
    total_volume?: unknown;
    total_trades?: unknown;
    total_traders?: unknown;
    total_new_users?: unknown;
    total_oi?: unknown;
  };
  daily_volume?: {
    dates?: string[];
    series?: SeriesMap;
  };
  daily_trades?: {
    dates?: string[];
    series?: SeriesMap;
  };
  daily_oi?: {
    dates?: string[];
    series?: SeriesMap;
  };
  market_share?: Record<
    string,
    {
      volume?: unknown;
      volume_pct?: unknown;
      trades?: unknown;
      traders?: unknown;
      oi?: unknown;
      oi_pct?: unknown;
    }
  >;
  markets?: {
    all?: unknown[];
  };
  dexes?: string[];
  generated_at?: string;
};

type FlowScanPerDex = Record<
  string,
  {
    total?: {
      volume?: unknown;
      trades?: unknown;
      traders?: unknown;
      oi?: unknown;
    };
    markets?: Array<{
      symbol?: string;
      canonical?: string;
      volume?: unknown;
      traders?: unknown;
      oi?: unknown;
    }>;
  }
>;

type FlowScanBuilders = {
  totals?: {
    total?: unknown;
    "30d"?: unknown;
    "90d"?: unknown;
    total_pct?: unknown;
    "30d_pct"?: unknown;
    "90d_pct"?: unknown;
  };
  summary?: Array<{
    address?: string;
    name?: string;
    total?: unknown;
    "30d"?: unknown;
    "90d"?: unknown;
    share_builder_total?: unknown;
    share_dex_total?: unknown;
  }>;
};

export type Hip3TimeSeries = {
  dates: string[];
  series: Array<{
    name: string;
    values: number[];
  }>;
};

export type Hip3MarketRank = {
  dex: string;
  symbol: string;
  canonical: string;
  oi: number;
  volume: number;
  traders: number;
};

export type Hip3BuilderRank = {
  name: string;
  address: string;
  totalVolume: number;
  volume30d: number;
  volume90d: number;
  builderShare: number;
  dexShare: number;
};

export type Hip3DexShare = {
  dex: string;
  volume: number;
  volumePct: number;
  oi: number;
  oiPct: number;
};

export type Hip3DashboardData = {
  updatedAt: string;
  cacheExpiresAt: string;
  source: string;
  overview: {
    totalVolume: number;
    totalTrades: number;
    totalTraders: number;
    totalNewUsers: number;
    totalOi: number;
    marketsCount: number;
    dexCount: number;
  };
  dailyVolume: Hip3TimeSeries;
  dailyTrades: Hip3TimeSeries;
  dailyOi: Hip3TimeSeries;
  dexShares: Hip3DexShare[];
  topMarketsByOi: Hip3MarketRank[];
  topBuilders: Hip3BuilderRank[];
  builderTotals: {
    totalVolume: number;
    volume30d: number;
    volume90d: number;
    totalPct: number;
    pct30d: number;
    pct90d: number;
  };
};

let cachedDashboardData: { data: Hip3DashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<Hip3DashboardData> | null = null;

function asNumber(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function trimSeries(dates: string[], series: SeriesMap | undefined, limit = 90): Hip3TimeSeries {
  const start = Math.max(0, dates.length - limit);
  const trimmedDates = dates.slice(start);

  return {
    dates: trimmedDates,
    series: Object.entries(series ?? {}).map(([name, values]) => ({
      name,
      values: values.slice(start).map(asNumber),
    })),
  };
}

export function buildHip3DashboardData(
  snapshot: FlowScanSnapshot,
  perDex: FlowScanPerDex,
  builders: FlowScanBuilders,
): Hip3DashboardData {
  const dexes = snapshot.dexes ?? Object.keys(perDex);
  const dexShares = Object.entries(snapshot.market_share ?? {})
    .map(([dex, metrics]) => ({
      dex,
      volume: asNumber(metrics.volume),
      volumePct: asNumber(metrics.volume_pct),
      oi: asNumber(metrics.oi),
      oiPct: asNumber(metrics.oi_pct),
    }))
    .sort((a, b) => b.volume - a.volume);

  const topMarketsByOi = Object.entries(perDex)
    .flatMap(([dex, dexData]) =>
      (dexData.markets ?? []).map((market) => ({
        dex,
        symbol: market.symbol ?? market.canonical ?? "Unknown",
        canonical: market.canonical ?? market.symbol ?? "Unknown",
        oi: asNumber(market.oi),
        volume: asNumber(market.volume),
        traders: asNumber(market.traders),
      })),
    )
    .sort((a, b) => b.oi - a.oi)
    .slice(0, 12);

  const topBuilders = (builders.summary ?? [])
    .map((builder) => ({
      name: builder.name ?? "Unknown",
      address: builder.address ?? "",
      totalVolume: asNumber(builder.total),
      volume30d: asNumber(builder["30d"]),
      volume90d: asNumber(builder["90d"]),
      builderShare: asNumber(builder.share_builder_total),
      dexShare: asNumber(builder.share_dex_total),
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 8);

  const generatedAt = snapshot.generated_at;

  return {
    updatedAt: generatedAt ? new Date(generatedAt).toISOString() : new Date().toISOString(),
    cacheExpiresAt: new Date(Date.now() + DASHBOARD_CACHE_MS).toISOString(),
    source: "Flowscan public page API",
    overview: {
      totalVolume: asNumber(snapshot.overview?.total_volume),
      totalTrades: asNumber(snapshot.overview?.total_trades),
      totalTraders: asNumber(snapshot.overview?.total_traders),
      totalNewUsers: asNumber(snapshot.overview?.total_new_users),
      totalOi: asNumber(snapshot.overview?.total_oi),
      marketsCount: snapshot.markets?.all?.length ?? topMarketsByOi.length,
      dexCount: dexes.length,
    },
    dailyVolume: trimSeries(snapshot.daily_volume?.dates ?? [], snapshot.daily_volume?.series),
    dailyTrades: trimSeries(snapshot.daily_trades?.dates ?? [], snapshot.daily_trades?.series),
    dailyOi: trimSeries(snapshot.daily_oi?.dates ?? [], snapshot.daily_oi?.series),
    dexShares,
    topMarketsByOi,
    topBuilders,
    builderTotals: {
      totalVolume: asNumber(builders.totals?.total),
      volume30d: asNumber(builders.totals?.["30d"]),
      volume90d: asNumber(builders.totals?.["90d"]),
      totalPct: asNumber(builders.totals?.total_pct),
      pct30d: asNumber(builders.totals?.["30d_pct"]),
      pct90d: asNumber(builders.totals?.["90d_pct"]),
    },
  };
}

async function fetchFlowScanJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${FLOWSCAN_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      accept: "application/json,text/plain,*/*",
      referer: "https://www.flowscan.xyz/hip-3",
      "user-agent": "Mozilla/5.0 (compatible; HyperEVMHub/1.0)",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Flowscan ${path} responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function loadHip3DashboardData(signal?: AbortSignal): Promise<Hip3DashboardData> {
  const [snapshot, perDex, builders] = await Promise.all([
    fetchFlowScanJson<FlowScanSnapshot>("/api/dex-stats/snapshot", signal),
    fetchFlowScanJson<FlowScanPerDex>("/api/dex-stats/per-dex", signal),
    fetchFlowScanJson<FlowScanBuilders>("/api/dex-stats/builders", signal),
  ]);

  return buildHip3DashboardData(snapshot, perDex, builders);
}

export async function refreshHip3DashboardData(signal?: AbortSignal): Promise<Hip3DashboardData> {
  const loadedData = await loadHip3DashboardData(signal);
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;
  const data = {
    ...loadedData,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
  cachedDashboardData = {
    data,
    expiresAt,
  };

  return data;
}

export async function getHip3DashboardData(signal?: AbortSignal): Promise<Hip3DashboardData> {
  const now = Date.now();
  if (cachedDashboardData && cachedDashboardData.expiresAt > now) {
    return cachedDashboardData.data;
  }

  pendingDashboardData ??= refreshHip3DashboardData(signal).finally(() => {
    pendingDashboardData = null;
  });

  return pendingDashboardData;
}
