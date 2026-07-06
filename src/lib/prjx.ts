const DEFILLAMA_PROTOCOL_URL = "https://api.llama.fi/protocol/project-x";
const DEFILLAMA_DEX_VOLUME_URL = "https://api.llama.fi/summary/dexs/project-x?excludeTotalDataChartBreakdown=true";
const PRJX_POOLS_URL = "https://api.prjx.com/pools";
const PRJX_POSITION_MANAGER_ADDRESS = "0xead19ae861c29bbb2101e834922b2feee69b9091";
const HYPEREVM_RPC_URL = "https://rpc.hyperliquid.xyz/evm";
const HYPEREVM_CHAIN_NAME = "Hyperliquid L1";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/prjx-dashboard.json";

type DefiLlamaProtocolResponse = {
  category?: string;
  chain?: string;
  chainTvls?: Record<
    string,
    {
      tvl?: Array<{
        date?: unknown;
        totalLiquidityUSD?: unknown;
      }>;
    }
  >;
  currentChainTvls?: Record<string, unknown>;
  description?: string;
  name?: string;
  twitter?: string;
  url?: string;
};

type PrjxPoolsResponse = {
  pools?: Array<{
    apr?: unknown;
    baseApr?: unknown;
    fee24h?: unknown;
    feeTier?: unknown;
    id?: unknown;
    name?: unknown;
    token0?: { logoURI?: unknown; symbol?: unknown };
    token1?: { logoURI?: unknown; symbol?: unknown };
    tvlUSD?: unknown;
    version?: unknown;
    volume24h?: unknown;
  }>;
};

type DefiLlamaDexVolumeResponse = {
  total24h?: unknown;
  totalDataChart?: Array<[unknown, unknown]>;
};

type JsonRpcResponse = {
  error?: { message?: string };
  result?: unknown;
};

type PrjxLpDepositorStats = {
  count: number | null;
  helper: string;
};

export type PrjxTvlPoint = {
  date: number;
  tvl: number;
};

export type PrjxDexVolumePoint = {
  date: number;
  volume: number;
};

export type PrjxLpPoolRow = {
  apr: number | null;
  baseApr: number | null;
  fee24h: number | null;
  feeTier: number | null;
  id: string;
  name: string;
  rank: number;
  token0Logo: string;
  token0Symbol: string;
  token1Logo: string;
  token1Symbol: string;
  tvlUsd: number;
  version: string;
  volume24h: number | null;
};

export type PrjxDashboardData = {
  cacheExpiresAt: string;
  info: {
    category: string;
    chain: string;
    currentDexVolume24h: number;
    currentTvl: number;
    description: string;
    name: string;
    twitter: string;
    url: string;
  };
  dexVolumeHistory: PrjxDexVolumePoint[];
  lpPools: PrjxLpPoolRow[];
  source: string;
  stats: {
    latestDate: number | null;
    lpDepositors: number | null;
    lpDepositorsHelper: string;
    peakTvl: number | null;
    tvlChange7d: number | null;
    tvlChange30d: number | null;
  };
  tvlHistory: PrjxTvlPoint[];
  updatedAt: string;
};

let cachedDashboardData: { data: PrjxDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<PrjxDashboardData> | null = null;

function asNumber(value: unknown) {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function asNullableNumber(value: unknown) {
  const parsed = asNumber(value);
  return parsed > 0 ? parsed : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function cacheExpiresAtMs(data: PrjxDashboardData) {
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

async function fetchJsonRpc<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
  const response = await fetch(process.env.HYPEREVM_RPC_URL ?? HYPEREVM_RPC_URL, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "hyper-evm-hub/1.0",
    },
    method: "POST",
    next: { revalidate: 3600 },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${method} returned ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse;

  if (payload.error) {
    throw new Error(payload.error.message ?? `${method} failed`);
  }

  return payload.result as T;
}

function nearestPreviousTvl(history: PrjxTvlPoint[], targetDate: number) {
  return history.filter((point) => point.date <= targetDate).at(-1)?.tvl ?? null;
}

function calculateChangePercent(current: number, previous: number | null) {
  if (previous === null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function buildLpRows(pools: PrjxPoolsResponse["pools"]): PrjxLpPoolRow[] {
  return [...(pools ?? [])]
    .map((pool) => ({
      apr: asNullableNumber(pool.apr),
      baseApr: asNullableNumber(pool.baseApr),
      fee24h: asNullableNumber(pool.fee24h),
      feeTier: asNullableNumber(pool.feeTier),
      id: asString(pool.id),
      name: asString(pool.name),
      rank: 0,
      token0Logo: asString(pool.token0?.logoURI),
      token0Symbol: asString(pool.token0?.symbol),
      token1Logo: asString(pool.token1?.logoURI),
      token1Symbol: asString(pool.token1?.symbol),
      tvlUsd: asNumber(pool.tvlUSD),
      version: asString(pool.version),
      volume24h: asNullableNumber(pool.volume24h),
    }))
    .filter((pool) => pool.id && pool.name && pool.tvlUsd > 0)
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 10)
    .map((pool, index) => ({ ...pool, rank: index + 1 }));
}

function buildDexVolumeHistory(volume: DefiLlamaDexVolumeResponse): PrjxDexVolumePoint[] {
  return [...(volume.totalDataChart ?? [])]
    .map(([date, value]) => ({
      date: asNumber(date),
      volume: asNumber(value),
    }))
    .filter((point) => point.date > 0 && point.volume > 0)
    .sort((a, b) => a.date - b.date);
}

function parseHexQuantity(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("0x")) return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchPrjxLpDepositorStats(signal?: AbortSignal): Promise<PrjxLpDepositorStats> {
  try {
    const result = await fetchJsonRpc<string>(
      "eth_call",
      [
        {
          data: "0x18160ddd",
          to: PRJX_POSITION_MANAGER_ADDRESS,
        },
        "latest",
      ],
      signal,
    );
    const totalSupply = parseHexQuantity(result);

    return {
      count: totalSupply,
      helper: "PRJX V3 LP position NFTs",
    };
  } catch (error) {
    console.warn(`Unable to load Project X LP depositor stats: ${error instanceof Error ? error.message : String(error)}`);
    return {
      count: null,
      helper: "LP depositor data unavailable",
    };
  }
}

export function buildPrjxDashboardData(
  protocol: DefiLlamaProtocolResponse,
  pools: PrjxPoolsResponse,
  volume: DefiLlamaDexVolumeResponse = {},
  lpDepositors: PrjxLpDepositorStats = { count: null, helper: "LP depositor data unavailable" },
): PrjxDashboardData {
  const updatedAt = new Date();
  const tvlHistory = [...(protocol.chainTvls?.[HYPEREVM_CHAIN_NAME]?.tvl ?? [])]
    .map((point) => ({
      date: asNumber(point.date),
      tvl: asNumber(point.totalLiquidityUSD),
    }))
    .filter((point) => point.date > 0 && point.tvl > 0)
    .sort((a, b) => a.date - b.date);
  const latest = tvlHistory.at(-1) ?? null;
  const currentTvl = asNumber(protocol.currentChainTvls?.[HYPEREVM_CHAIN_NAME]) || latest?.tvl || 0;
  const peakTvl = tvlHistory.length > 0 ? Math.max(...tvlHistory.map((point) => point.tvl)) : null;
  const latestDate = latest?.date ?? null;
  const previous7d = latestDate ? nearestPreviousTvl(tvlHistory, latestDate - 7 * 24 * 60 * 60) : null;
  const previous30d = latestDate ? nearestPreviousTvl(tvlHistory, latestDate - 30 * 24 * 60 * 60) : null;
  const dexVolumeHistory = buildDexVolumeHistory(volume);

  return {
    cacheExpiresAt: new Date(updatedAt.getTime() + DASHBOARD_CACHE_MS).toISOString(),
    info: {
      category: protocol.category ?? "Dexs",
      chain: protocol.chain ?? HYPEREVM_CHAIN_NAME,
      currentDexVolume24h: asNumber(volume.total24h) || dexVolumeHistory.at(-1)?.volume || 0,
      currentTvl,
      description: protocol.description ?? "",
      name: protocol.name ?? "Project X",
      twitter: protocol.twitter ?? "prjx_hl",
      url: protocol.url ?? "https://www.prjx.com",
    },
    dexVolumeHistory,
    lpPools: buildLpRows(pools.pools),
    source: "DefiLlama protocol and DEX volume APIs + Project X pools API",
    stats: {
      latestDate,
      lpDepositors: lpDepositors.count,
      lpDepositorsHelper: lpDepositors.helper,
      peakTvl,
      tvlChange7d: calculateChangePercent(currentTvl, previous7d),
      tvlChange30d: calculateChangePercent(currentTvl, previous30d),
    },
    tvlHistory,
    updatedAt: updatedAt.toISOString(),
  };
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as PrjxDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (
      !Array.isArray(data.tvlHistory) ||
      !Array.isArray(data.dexVolumeHistory) ||
      !Array.isArray(data.lpPools) ||
      typeof data.stats?.lpDepositorsHelper !== "string" ||
      expiresAt <= 0
    ) {
      return null;
    }

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: PrjxDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write PRJX dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function refreshPrjxDashboardData(signal?: AbortSignal) {
  const [protocol, pools, volume, lpDepositors] = await Promise.all([
    fetchJson<DefiLlamaProtocolResponse>(DEFILLAMA_PROTOCOL_URL, signal),
    fetchJson<PrjxPoolsResponse>(PRJX_POOLS_URL, signal),
    fetchJson<DefiLlamaDexVolumeResponse>(DEFILLAMA_DEX_VOLUME_URL, signal),
    fetchPrjxLpDepositorStats(signal),
  ]);
  const data = buildPrjxDashboardData(protocol, pools, volume, lpDepositors);
  cachedDashboardData = { data, expiresAt: cacheExpiresAtMs(data) };
  await writeDashboardDataToDisk(data);
  return data;
}

export async function getPrjxDashboardData() {
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
    pendingDashboardData = refreshPrjxDashboardData().finally(() => {
      pendingDashboardData = null;
    });
  }

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (diskData) {
      console.warn(`Returning stale PRJX dashboard data after refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      return diskData.data;
    }

    throw error;
  }
}
