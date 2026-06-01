const DEFILLAMA_API_BASE_URL = "https://api.llama.fi";
const HYPEREVM_CHAIN_NAME = "Hyperliquid L1";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const TOP_PROTOCOL_LIMIT = 20;
const DETAIL_TIMEOUT_MS = 6000;
const EXCLUDED_PROTOCOL_CATEGORIES = new Set(["Bridge", "CEX"]);
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/hyperevm-tvl-dashboard.json";

type DefiLlamaProtocolSummary = {
  name?: string;
  slug?: string;
  category?: string;
  logo?: string;
  chains?: string[];
  chainTvls?: Record<string, unknown>;
  parentProtocol?: string;
};

type DefiLlamaProtocolDetail = {
  chainTvls?: Record<
    string,
    {
      tvl?: Array<{
        date?: unknown;
        totalLiquidityUSD?: unknown;
      }>;
    }
  >;
};

type DefiLlamaFeesOverview = {
  protocols?: Array<{
    slug?: string;
    name?: string;
    parentProtocol?: string;
    total24h?: unknown;
    total7d?: unknown;
    total30d?: unknown;
  }>;
};

export type HyperEvmTvlRow = {
  rank: number;
  name: string;
  slug: string;
  category: string;
  logo: string;
  currentTvl: number;
  tvlChange24h: number | null;
  tvlChange7d: number | null;
  tvlChange30d: number | null;
  fees24h: number | null;
  fees7d: number | null;
  fees30d: number | null;
  revenue24h: number | null;
};

export type HyperEvmTvlDashboardData = {
  updatedAt: string;
  cacheExpiresAt: string;
  source: string;
  rows: HyperEvmTvlRow[];
  totals: {
    protocols: number;
    currentTvl: number;
    fees24h: number;
    fees7d: number;
    fees30d: number;
    revenue24h: number;
  };
};

let cachedDashboardData: { data: HyperEvmTvlDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<HyperEvmTvlDashboardData> | null = null;

function cacheExpiresAtMs(data: HyperEvmTvlDashboardData) {
  const expiresAt = new Date(data.cacheExpiresAt).getTime();
  return Number.isFinite(expiresAt) ? expiresAt : 0;
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as HyperEvmTvlDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (!Array.isArray(data.rows) || expiresAt <= 0) {
      return null;
    }

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: HyperEvmTvlDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write HyperEVM TVL dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function asNumber(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : 0;
}

type RankedHyperEvmProtocol = {
  category: string;
  children: Array<{
    slug: string;
    tvl: number;
  }>;
  currentTvl: number;
  groupKey: string;
  logo: string;
  name: string;
  slug: string;
};

function parentSlug(parentProtocol: string) {
  return parentProtocol.replace(/^parent#/, "");
}

function formatProtocolName(slug: string) {
  const overrides: Record<string, string> = {
    felix: "Felix",
    hyperbeat: "Hyperbeat",
    hyperlend: "HyperLend",
    hyperliquid: "Hyperliquid",
    hyperswap: "HyperSwap",
    kinetiq: "Kinetiq",
    "mev-capital": "MEV Capital",
    "rysk-finance": "Rysk Finance",
    valantis: "Valantis",
  };

  return (
    overrides[slug] ??
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function groupKeyForProtocol(protocol: { parentProtocol?: string; slug?: string }) {
  return protocol.parentProtocol ?? protocol.slug ?? "";
}

function previousTvlForChild(childSlug: string, protocolDetails: Record<string, DefiLlamaProtocolDetail>, targetDate: number) {
  const history = [...(protocolDetails[childSlug]?.chainTvls?.[HYPEREVM_CHAIN_NAME]?.tvl ?? [])]
    .map((point) => ({
      date: asNumber(point.date),
      tvl: asNumber(point.totalLiquidityUSD),
    }))
    .filter((point) => point.date > 0 && point.tvl > 0)
    .sort((a, b) => a.date - b.date);

  if (history.length === 0) {
    return null;
  }

  return history.filter((point) => point.date <= targetDate).at(-1)?.tvl ?? history[0].tvl;
}

function calculateGroupChangePercent(protocol: RankedHyperEvmProtocol, protocolDetails: Record<string, DefiLlamaProtocolDetail>, days: number) {
  const childHistories = protocol.children
    .map((child) => protocolDetails[child.slug]?.chainTvls?.[HYPEREVM_CHAIN_NAME]?.tvl ?? [])
    .flat()
    .map((point) => ({ date: asNumber(point.date), tvl: asNumber(point.totalLiquidityUSD) }))
    .filter((point) => point.date > 0 && point.tvl > 0);
  const latestDate = childHistories.sort((a, b) => a.date - b.date).at(-1)?.date;

  if (!latestDate) {
    return null;
  }

  const targetDate = latestDate - days * 24 * 60 * 60;
  let previousTotal = 0;
  for (const child of protocol.children) {
    previousTotal += previousTvlForChild(child.slug, protocolDetails, targetDate) ?? child.tvl;
  }

  if (previousTotal <= 0) {
    return null;
  }

  return ((protocol.currentTvl - previousTotal) / previousTotal) * 100;
}

function rankHyperEvmProtocols(protocols: DefiLlamaProtocolSummary[]) {
  const groups = new Map<string, RankedHyperEvmProtocol>();

  for (const protocol of protocols) {
    const category = protocol.category ?? "Other";
    const slug = protocol.slug ?? "";
    const tvl = asNumber(protocol.chainTvls?.[HYPEREVM_CHAIN_NAME]);

    if (!slug || !protocol.chains?.includes(HYPEREVM_CHAIN_NAME) || tvl <= 0 || EXCLUDED_PROTOCOL_CATEGORIES.has(category)) {
      continue;
    }

    const groupKey = groupKeyForProtocol(protocol);
    if (!groupKey) {
      continue;
    }

    const existing = groups.get(groupKey);
    if (existing) {
      existing.currentTvl += tvl;
      existing.children.push({ slug, tvl });
      if (tvl > existing.children[0].tvl) {
        existing.logo = protocol.logo ?? existing.logo;
        existing.category = category;
      }
      continue;
    }

    const displaySlug = protocol.parentProtocol ? parentSlug(protocol.parentProtocol) : slug;
    groups.set(groupKey, {
      category,
      children: [{ slug, tvl }],
      currentTvl: tvl,
      groupKey,
      logo: protocol.logo ?? "",
      name: protocol.parentProtocol && protocol.parentProtocol !== "parent#morpho" ? formatProtocolName(displaySlug) : protocol.name ?? formatProtocolName(displaySlug),
      slug: displaySlug,
    });
  }

  return [...groups.values()]
    .sort((a, b) => b.currentTvl - a.currentTvl)
    .slice(0, TOP_PROTOCOL_LIMIT);
}

function sumOverviewByGroup(overview: DefiLlamaFeesOverview, groupKey: string, key: "total24h" | "total7d" | "total30d") {
  const total = (overview.protocols ?? [])
    .filter((protocol) => groupKeyForProtocol(protocol) === groupKey)
    .reduce((sum, protocol) => sum + asNumber(protocol[key]), 0);

  return total > 0 ? total : null;
}

export function buildHyperEvmTvlDashboardData(
  protocols: DefiLlamaProtocolSummary[],
  protocolDetails: Record<string, DefiLlamaProtocolDetail>,
  feesOverview: DefiLlamaFeesOverview,
  revenueOverview: DefiLlamaFeesOverview = {},
): HyperEvmTvlDashboardData {
  const ranked = rankHyperEvmProtocols(protocols);

  const rows = ranked.map((protocol, index) => {
    return {
      rank: index + 1,
      name: protocol.name,
      slug: protocol.slug,
      category: protocol.category,
      logo: protocol.logo,
      currentTvl: protocol.currentTvl,
      tvlChange24h: calculateGroupChangePercent(protocol, protocolDetails, 1),
      tvlChange7d: calculateGroupChangePercent(protocol, protocolDetails, 7),
      tvlChange30d: calculateGroupChangePercent(protocol, protocolDetails, 30),
      fees24h: sumOverviewByGroup(feesOverview, protocol.groupKey, "total24h"),
      fees7d: sumOverviewByGroup(feesOverview, protocol.groupKey, "total7d"),
      fees30d: sumOverviewByGroup(feesOverview, protocol.groupKey, "total30d"),
      revenue24h: sumOverviewByGroup(revenueOverview, protocol.groupKey, "total24h"),
    };
  });

  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;
  return {
    updatedAt: new Date().toISOString(),
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    source: "DefiLlama free API",
    rows,
    totals: {
      protocols: rows.length,
      currentTvl: rows.reduce((total, row) => total + row.currentTvl, 0),
      fees24h: rows.reduce((total, row) => total + (row.fees24h ?? 0), 0),
      fees7d: rows.reduce((total, row) => total + (row.fees7d ?? 0), 0),
      fees30d: rows.reduce((total, row) => total + (row.fees30d ?? 0), 0),
      revenue24h: rows.reduce((total, row) => total + (row.revenue24h ?? 0), 0),
    },
  };
}

function isRetryableFetchError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("terminated") || message.includes("timeout") || message.includes("aborted") || message.includes("econnreset");
}

async function fetchDefiLlamaJsonOnce<T>(path: string, signal?: AbortSignal, timeoutMs = 30000): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const response = await fetch(`${DEFILLAMA_API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 (compatible; HyperEVMHub/1.0)",
    },
    signal: requestSignal,
  });

  if (!response.ok) {
    throw new Error(`DefiLlama ${path} responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchDefiLlamaJson<T>(path: string, signal?: AbortSignal, timeoutMs = 30000, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetchDefiLlamaJsonOnce<T>(path, signal, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableFetchError(error)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 700));
    }
  }

  throw lastError;
}

async function loadHyperEvmTvlDashboardData(signal?: AbortSignal): Promise<HyperEvmTvlDashboardData> {
  const [protocols, feesOverview, revenueOverview] = await Promise.all([
    fetchDefiLlamaJson<DefiLlamaProtocolSummary[]>("/protocols", signal),
    fetchDefiLlamaJson<DefiLlamaFeesOverview>("/overview/fees/hyperliquid-l1?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true", signal),
    fetchDefiLlamaJson<DefiLlamaFeesOverview>("/overview/fees/hyperliquid-l1?dataType=dailyRevenue&excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true", signal),
  ]);

  const ranked = rankHyperEvmProtocols(protocols);
  const slugs = [...new Set(ranked.flatMap((protocol) => protocol.children.map((child) => child.slug)))];
  const detailsEntries = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const detail = await fetchDefiLlamaJson<DefiLlamaProtocolDetail>(`/protocol/${slug}`, signal, DETAIL_TIMEOUT_MS);
        return [slug, detail] as const;
      } catch {
        return [slug, {}] as const;
      }
    }),
  );

  return buildHyperEvmTvlDashboardData(protocols, Object.fromEntries(detailsEntries), feesOverview, revenueOverview);
}

export async function refreshHyperEvmTvlDashboardData(signal?: AbortSignal): Promise<HyperEvmTvlDashboardData> {
  const loadedData = await loadHyperEvmTvlDashboardData(signal);
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;
  const data = {
    ...loadedData,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
  cachedDashboardData = {
    data,
    expiresAt,
  };
  await writeDashboardDataToDisk(data);

  return data;
}

export async function getHyperEvmTvlDashboardData(signal?: AbortSignal): Promise<HyperEvmTvlDashboardData> {
  const now = Date.now();
  if (cachedDashboardData && cachedDashboardData.expiresAt > now) {
    return cachedDashboardData.data;
  }

  const diskCache = await readDashboardDataFromDisk();
  if (diskCache) {
    cachedDashboardData = diskCache;
    if (diskCache.expiresAt > now) {
      return diskCache.data;
    }
  }

  pendingDashboardData ??= refreshHyperEvmTvlDashboardData(signal).finally(() => {
    pendingDashboardData = null;
  });

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (cachedDashboardData) {
      console.warn(
        `Returning stale HyperEVM TVL dashboard data after refresh failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return cachedDashboardData.data;
    }

    throw error;
  }
}
