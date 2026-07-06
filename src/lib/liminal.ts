const DEFILLAMA_PROTOCOL_URL = "https://api.llama.fi/protocol/liminal";
const DEFILLAMA_FEES_URL = "https://api.llama.fi/summary/fees/liminal?dataType=dailyFees&excludeTotalDataChartBreakdown=true";
const DEFILLAMA_REVENUE_URL = "https://api.llama.fi/summary/fees/liminal?dataType=dailyRevenue&excludeTotalDataChartBreakdown=true";
const LIMINAL_XTOKENS_URL = "https://api2.liminal.money/api/info/xtokens/list";
const LIMINAL_XTOKEN_APY_URL = "https://api2.liminal.money/sdk/tokenized";
const LIMINAL_DEPOSITORS_URL = "https://api2.liminal.money/api/info/unique-depositors";
const LIMINAL_VOLUME_URL = "https://api2.liminal.money/api/info/volume-history";
const LIMINAL_TVL_HISTORY_URL = "https://api2.liminal.money/api/info/tvl-history";
const HYPERLIQUID_CHAIN_NAME = "Hyperliquid L1";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/liminal-dashboard.json";

type DefiLlamaProtocolResponse = {
  chainTvls?: Record<string, { tvl?: Array<{ date?: unknown; totalLiquidityUSD?: unknown }> } | undefined>;
  currentChainTvls?: Record<string, unknown>;
  description?: string;
  name?: string;
  twitter?: string;
  url?: string;
};

type DefiLlamaSummaryResponse = {
  total24h?: unknown;
  total7d?: unknown;
  total30d?: unknown;
  totalAllTime?: unknown;
};

type LiminalXTokenResponse = {
  data?: LiminalXTokenRaw[];
  success?: boolean;
};

type LiminalXTokenRaw = {
  depositPipes?: Array<{ ofts?: Array<{ symbol?: unknown }> }>;
  icon?: unknown;
  isActive?: unknown;
  leverage?: unknown;
  name?: unknown;
  navOracleAddress?: unknown;
  shareManagerAddress?: unknown;
  shareOFTs?: Array<{ chainId?: { name?: unknown }; symbol?: unknown }>;
  underlyingAssetAddress?: unknown;
  vaultType?: unknown;
};

type LiminalApyPointRaw = {
  timestamp?: unknown;
  trailing3d?: unknown;
  trailing7d?: unknown;
  trailing30d?: unknown;
};

type LiminalDepositorPointRaw = {
  cumulativeUsers?: unknown;
  date?: unknown;
  newUsers?: unknown;
};

type LiminalDepositorBucket = {
  data?: LiminalDepositorPointRaw[];
  summary?: {
    currentCumulativeUsers?: unknown;
    totalNewUsers?: unknown;
  };
};

type LiminalDepositorsResponse = {
  data?: Record<string, LiminalDepositorBucket | undefined>;
  success?: boolean;
};

type LiminalVolumePointRaw = {
  date?: unknown;
  totalTrades?: unknown;
  totalVolume?: unknown;
};

type LiminalVolumeBucket = {
  data?: LiminalVolumePointRaw[];
  summary?: {
    avgDailyVolume?: unknown;
    totalTrades?: unknown;
    totalVolume?: unknown;
  };
};

type LiminalVolumeResponse = {
  data?: Record<string, LiminalVolumeBucket | undefined>;
  success?: boolean;
};

type LiminalCustomizedTvlPointRaw = {
  timestamp?: unknown;
  totalValueLocked?: unknown;
};

type LiminalTokenizedTvlPointRaw = {
  timestamp?: unknown;
  totalAssets?: unknown;
};

type LiminalTokenizedTvlSeriesRaw = {
  data?: LiminalTokenizedTvlPointRaw[];
  xTokenName?: unknown;
};

type LiminalTvlHistoryResponse = {
  data?: {
    customized?: LiminalCustomizedTvlPointRaw[];
    tokenized?: LiminalTokenizedTvlSeriesRaw[];
  };
  success?: boolean;
};

export type LiminalTvlPoint = {
  date: number;
  tvl: number;
};

export type LiminalSplitTvlPoint = {
  customizedTvl: number;
  date: number;
  tokenizedTvl: number;
  totalTvl: number;
};

export type LiminalDepositorPoint = {
  cumulativeUsers: number;
  date: number;
  newUsers: number;
};

export type LiminalVolumePoint = {
  date: number;
  trades: number;
  volume: number;
};

export type LiminalApyPoint = {
  timestamp: number;
  trailing3d: number;
  trailing7d: number;
  trailing30d: number;
};

export type LiminalTokenRow = {
  active: boolean;
  apyHistory: LiminalApyPoint[];
  chains: string[];
  depositAssets: string[];
  icon: string;
  leverage: number;
  name: string;
  navOracleAddress: string;
  shareManagerAddress: string;
  shareSymbols: string[];
  trailing3dApy: number | null;
  trailing7dApy: number | null;
  trailing30dApy: number | null;
  underlyingAssetAddress: string;
  vaultType: string;
};

export type LiminalDashboardData = {
  cacheExpiresAt: string;
  info: {
    chain: string;
    currentTvl: number;
    description: string;
    name: string;
    twitter: string;
    url: string;
  };
  source: string;
  stats: {
    fees24h: number;
    fees7d: number;
    fees30d: number;
    feesAllTime: number;
    depositors24hGrowth: number | null;
    depositors30dGrowth: number | null;
    depositorsCurrent: number;
    revenue24h: number;
    revenue7d: number;
    revenue30d: number;
    revenueAllTime: number;
    tvl24hChangePct: number | null;
    tvl24hChangeUsd: number | null;
    tvl30dChangePct: number | null;
    tvl30dChangeUsd: number | null;
    customizedTvl: number;
    tokenizedTvl: number;
    volume24h: number;
    volumeAvgDaily: number;
    volumeLifetime: number;
  };
  depositorHistory: LiminalDepositorPoint[];
  splitTvlHistory: LiminalSplitTvlPoint[];
  tokens: LiminalTokenRow[];
  tvlHistory: LiminalTvlPoint[];
  volumeHistory: LiminalVolumePoint[];
  updatedAt: string;
};

let cachedDashboardData: { data: LiminalDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<LiminalDashboardData> | null = null;

function asNumber(value: unknown) {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asUnixSeconds(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
}

function asUtcDaySeconds(value: unknown) {
  const seconds = asUnixSeconds(value);
  if (seconds <= 0) return 0;
  const date = new Date(seconds * 1000);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 1000;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function pctChange(current: number, previous: number) {
  return previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(4)) : null;
}

function cacheExpiresAtMs(data: LiminalDashboardData) {
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

function buildTvlHistory(protocol: DefiLlamaProtocolResponse): LiminalTvlPoint[] {
  return [...(protocol.chainTvls?.[HYPERLIQUID_CHAIN_NAME]?.tvl ?? [])]
    .map((point) => ({
      date: asNumber(point.date),
      tvl: asNumber(point.totalLiquidityUSD),
    }))
    .filter((point) => point.date > 0 && point.tvl > 0)
    .sort((a, b) => a.date - b.date);
}

function findLookbackPoint<T extends { date: number }>(points: T[], current: T | undefined, days: number) {
  if (!current) return undefined;
  const targetDate = current.date - days * 86400;
  return [...points].reverse().find((point) => point.date <= targetDate) ?? points.at(-days - 1);
}

function buildApyHistory(points: LiminalApyPointRaw[] | undefined): LiminalApyPoint[] {
  return [...(points ?? [])]
    .map((point) => ({
      timestamp: asNumber(point.timestamp),
      trailing3d: asNumber(point.trailing3d),
      trailing7d: asNumber(point.trailing7d),
      trailing30d: asNumber(point.trailing30d),
    }))
    .filter((point) => point.timestamp > 0)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function buildTokenRows(tokens: LiminalXTokenRaw[], apyByToken: Record<string, LiminalApyPointRaw[] | undefined>): LiminalTokenRow[] {
  return tokens
    .map((token) => {
      const name = asText(token.name);
      const apyHistory = buildApyHistory(apyByToken[name]);
      const latestApy = apyHistory.at(-1);

      return {
        active: Boolean(token.isActive),
        apyHistory,
        chains: unique((token.shareOFTs ?? []).map((oft) => asText(oft.chainId?.name))),
        depositAssets: unique((token.depositPipes ?? []).flatMap((pipe) => (pipe.ofts ?? []).map((oft) => asText(oft.symbol)))),
        icon: asText(token.icon),
        leverage: asNumber(token.leverage),
        name,
        navOracleAddress: asText(token.navOracleAddress),
        shareManagerAddress: asText(token.shareManagerAddress),
        shareSymbols: unique((token.shareOFTs ?? []).map((oft) => asText(oft.symbol))),
        trailing3dApy: latestApy?.trailing3d ?? null,
        trailing7dApy: latestApy?.trailing7d ?? null,
        trailing30dApy: latestApy?.trailing30d ?? null,
        underlyingAssetAddress: asText(token.underlyingAssetAddress),
        vaultType: asText(token.vaultType),
      };
    })
    .filter((token) => token.name)
    .sort((a, b) => {
      const order = ["limUSD", "xLEND", "xHYPE", "xBTC"];
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
    });
}

function getDepositorBucket(depositors: LiminalDepositorsResponse | undefined) {
  const buckets = depositors?.data ?? {};
  if ((buckets.tokenized?.data?.length ?? 0) > 0) return buckets.tokenized;
  if ((buckets.customized?.data?.length ?? 0) > 0) return buckets.customized;
  return Object.values(buckets).find((bucket) => (bucket?.data?.length ?? 0) > 0);
}

function getVolumeBucket(volume: LiminalVolumeResponse | undefined) {
  const buckets = volume?.data ?? {};
  if ((buckets.tokenized?.data?.length ?? 0) > 0) return buckets.tokenized;
  if ((buckets.customized?.data?.length ?? 0) > 0) return buckets.customized;
  return Object.values(buckets).find((bucket) => (bucket?.data?.length ?? 0) > 0);
}

function buildDepositorHistory(depositors: LiminalDepositorsResponse | undefined): LiminalDepositorPoint[] {
  return [...(getDepositorBucket(depositors)?.data ?? [])]
    .map((point) => ({
      cumulativeUsers: asNumber(point.cumulativeUsers),
      date: asUnixSeconds(point.date),
      newUsers: asNumber(point.newUsers),
    }))
    .filter((point) => point.date >= 0 && (point.cumulativeUsers > 0 || point.newUsers > 0))
    .sort((a, b) => a.date - b.date);
}

function buildVolumeHistory(volume: LiminalVolumeResponse | undefined): LiminalVolumePoint[] {
  return [...(getVolumeBucket(volume)?.data ?? [])]
    .map((point) => ({
      date: asUnixSeconds(point.date),
      trades: asNumber(point.totalTrades),
      volume: asNumber(point.totalVolume),
    }))
    .filter((point) => point.date >= 0 && point.volume > 0)
    .sort((a, b) => a.date - b.date);
}

function buildSplitTvlHistory(history: LiminalTvlHistoryResponse | undefined): LiminalSplitTvlPoint[] {
  const customizedByDate = new Map<number, number>();
  const customizedRows = [...(history?.data?.customized ?? [])]
    .map((point) => ({
      date: asUtcDaySeconds(point.timestamp),
      timestamp: asUnixSeconds(point.timestamp),
      tvl: asNumber(point.totalValueLocked),
    }))
    .filter((point) => point.date >= 0 && point.timestamp >= 0 && point.tvl > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const point of customizedRows) {
    customizedByDate.set(point.date, point.tvl);
  }

  const tokenizedByDateToken = new Map<number, Map<string, number>>();
  for (const series of history?.data?.tokenized ?? []) {
    const tokenName = asText(series.xTokenName);
    if (!tokenName) continue;
    const tokenRows = [...(series.data ?? [])]
      .map((point) => ({
        date: asUtcDaySeconds(point.timestamp),
        timestamp: asUnixSeconds(point.timestamp),
        tvl: asNumber(point.totalAssets),
      }))
      .filter((point) => point.date >= 0 && point.timestamp >= 0 && point.tvl > 0)
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const point of tokenRows) {
      const byToken = tokenizedByDateToken.get(point.date) ?? new Map<string, number>();
      byToken.set(tokenName, point.tvl);
      tokenizedByDateToken.set(point.date, byToken);
    }
  }

  const tokenizedByDate = new Map<number, number>();
  for (const [date, byToken] of tokenizedByDateToken.entries()) {
    tokenizedByDate.set(
      date,
      Array.from(byToken.values()).reduce((total, value) => total + value, 0),
    );
  }

  return [...new Set([...customizedByDate.keys(), ...tokenizedByDate.keys()])]
    .sort((a, b) => a - b)
    .map((date) => {
      const customizedTvl = customizedByDate.get(date) ?? 0;
      const tokenizedTvl = tokenizedByDate.get(date) ?? 0;
      return {
        customizedTvl,
        date,
        tokenizedTvl,
        totalTvl: customizedTvl + tokenizedTvl,
      };
    })
    .filter((point) => point.totalTvl > 0);
}

export function buildLiminalDashboardData(
  protocol: DefiLlamaProtocolResponse,
  fees: DefiLlamaSummaryResponse,
  revenue: DefiLlamaSummaryResponse,
  tokens: LiminalXTokenRaw[],
  apyByToken: Record<string, LiminalApyPointRaw[] | undefined>,
  volume?: LiminalVolumeResponse,
  splitTvl?: LiminalTvlHistoryResponse,
  depositors?: LiminalDepositorsResponse,
): LiminalDashboardData {
  const updatedAt = new Date();
  const tvlHistory = buildTvlHistory(protocol);
  const latestTvl = tvlHistory.at(-1);
  const currentTvl = asNumber(protocol.currentChainTvls?.[HYPERLIQUID_CHAIN_NAME]) || latestTvl?.tvl || 0;
  const previous24h = tvlHistory.at(-2);
  const previous30d = findLookbackPoint(tvlHistory, latestTvl, 30);
  const depositorHistory = buildDepositorHistory(depositors);
  const latestDepositors = depositorHistory.at(-1);
  const previous30dDepositors = findLookbackPoint(depositorHistory, latestDepositors, 30);
  const depositorBucket = getDepositorBucket(depositors);
  const depositorsCurrent = asNumber(depositorBucket?.summary?.currentCumulativeUsers) || latestDepositors?.cumulativeUsers || 0;
  const volumeHistory = buildVolumeHistory(volume);
  const volumeBucket = getVolumeBucket(volume);
  const splitTvlHistory = buildSplitTvlHistory(splitTvl);
  const latestSplitTvl = splitTvlHistory.at(-1);

  return {
    cacheExpiresAt: new Date(updatedAt.getTime() + DASHBOARD_CACHE_MS).toISOString(),
    info: {
      chain: HYPERLIQUID_CHAIN_NAME,
      currentTvl,
      description: protocol.description ?? "",
      name: protocol.name ?? "Liminal",
      twitter: protocol.twitter ?? "",
      url: protocol.url ?? "https://liminal.money/app/tokenized",
    },
    source: "DefiLlama protocol, fees, and revenue APIs + Liminal tokenized, TVL history, volume, and unique depositors APIs",
    stats: {
      fees24h: asNumber(fees.total24h),
      fees7d: asNumber(fees.total7d),
      fees30d: asNumber(fees.total30d),
      feesAllTime: asNumber(fees.totalAllTime),
      depositors24hGrowth: latestDepositors?.newUsers ?? null,
      depositors30dGrowth: previous30dDepositors ? depositorsCurrent - previous30dDepositors.cumulativeUsers : null,
      depositorsCurrent,
      revenue24h: asNumber(revenue.total24h),
      revenue7d: asNumber(revenue.total7d),
      revenue30d: asNumber(revenue.total30d),
      revenueAllTime: asNumber(revenue.totalAllTime),
      tvl24hChangePct: previous24h ? pctChange(currentTvl, previous24h.tvl) : null,
      tvl24hChangeUsd: previous24h ? currentTvl - previous24h.tvl : null,
      tvl30dChangePct: previous30d ? pctChange(currentTvl, previous30d.tvl) : null,
      tvl30dChangeUsd: previous30d ? currentTvl - previous30d.tvl : null,
      customizedTvl: latestSplitTvl?.customizedTvl ?? 0,
      tokenizedTvl: latestSplitTvl?.tokenizedTvl ?? 0,
      volume24h: volumeHistory.at(-1)?.volume ?? 0,
      volumeAvgDaily: asNumber(volumeBucket?.summary?.avgDailyVolume),
      volumeLifetime: asNumber(volumeBucket?.summary?.totalVolume),
    },
    depositorHistory,
    splitTvlHistory,
    tokens: buildTokenRows(tokens, apyByToken),
    tvlHistory,
    volumeHistory,
    updatedAt: updatedAt.toISOString(),
  };
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as LiminalDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (
      !Array.isArray(data.tokens) ||
      !Array.isArray(data.tvlHistory) ||
      !Array.isArray(data.depositorHistory) ||
      !Array.isArray(data.volumeHistory) ||
      !Array.isArray(data.splitTvlHistory) ||
      expiresAt <= 0
    ) {
      return null;
    }

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: LiminalDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write Liminal dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function refreshLiminalDashboardData(signal?: AbortSignal) {
  const [protocol, fees, revenue, tokenResponse, volume, splitTvl, depositors] = await Promise.all([
    fetchJson<DefiLlamaProtocolResponse>(DEFILLAMA_PROTOCOL_URL, signal),
    fetchJson<DefiLlamaSummaryResponse>(DEFILLAMA_FEES_URL, signal),
    fetchJson<DefiLlamaSummaryResponse>(DEFILLAMA_REVENUE_URL, signal),
    fetchJson<LiminalXTokenResponse>(LIMINAL_XTOKENS_URL, signal),
    fetchJson<LiminalVolumeResponse>(LIMINAL_VOLUME_URL, signal),
    fetchJson<LiminalTvlHistoryResponse>(LIMINAL_TVL_HISTORY_URL, signal),
    fetchJson<LiminalDepositorsResponse>(LIMINAL_DEPOSITORS_URL, signal),
  ]);
  const tokens = tokenResponse.data ?? [];
  const apyEntries = await Promise.all(
    tokens.map(async (token) => {
      const name = asText(token.name);
      if (!name) return [name, []] as const;
      const apy = await fetchJson<LiminalApyPointRaw[]>(`${LIMINAL_XTOKEN_APY_URL}/${encodeURIComponent(name)}/apy?range=max`, signal);
      return [name, apy] as const;
    }),
  );
  const data = buildLiminalDashboardData(protocol, fees, revenue, tokens, Object.fromEntries(apyEntries), volume, splitTvl, depositors);
  cachedDashboardData = { data, expiresAt: cacheExpiresAtMs(data) };
  await writeDashboardDataToDisk(data);
  return data;
}

export async function getLiminalDashboardData() {
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
    pendingDashboardData = refreshLiminalDashboardData().finally(() => {
      pendingDashboardData = null;
    });
  }

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (diskData) {
      console.warn(`Returning stale Liminal dashboard data after refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      return diskData.data;
    }

    throw error;
  }
}
