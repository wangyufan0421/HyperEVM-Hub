const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/hype-funding-dashboard.json";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const HISTORY_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

type FundingHistoryInput = {
  coin?: unknown;
  fundingRate?: unknown;
  premium?: unknown;
  time?: unknown;
};

type PredictedFundingInput = [unknown, Array<[unknown, null | {
  fundingIntervalHours?: unknown;
  fundingRate?: unknown;
  nextFundingTime?: unknown;
}]>];

type MetaAndAssetCtxsInput = [
  {
    universe?: Array<{ name?: unknown }>;
  },
  Array<{
    dayNtlVlm?: unknown;
    funding?: unknown;
    markPx?: unknown;
    midPx?: unknown;
    openInterest?: unknown;
    oraclePx?: unknown;
    premium?: unknown;
  }>,
];

export type HypeFundingHistoryRow = {
  annualizedPct: number;
  fundingRate: number;
  premium: number | null;
  time: number;
};

export type HypeFundingVenueRow = {
  annualizedPct: number | null;
  fundingIntervalHours: number | null;
  fundingRate: number | null;
  nextFundingTime: number | null;
  venue: string;
};

export type HypeFundingDashboardData = {
  cacheExpiresAt: string;
  current: {
    annualizedPct: number | null;
    dayVolumeUsd: number | null;
    fundingRate: number | null;
    markPrice: number | null;
    openInterest: number | null;
    oraclePrice: number | null;
    premium: number | null;
  };
  history: HypeFundingHistoryRow[];
  source: string;
  stats: {
    averageAnnualizedPct: number | null;
    averageFundingRate: number | null;
    highestFundingRate: number | null;
    latestFundingRate: number | null;
    lowestFundingRate: number | null;
    samples: number;
  };
  updatedAt: string;
  venues: HypeFundingVenueRow[];
};

let cachedDashboardData: { data: HypeFundingDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<HypeFundingDashboardData> | null = null;

function asNumber(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function asRequiredNumber(value: unknown) {
  return asNumber(value) ?? 0;
}

function annualizeFundingRate(rate: number | null, intervalHours = 1) {
  if (rate === null || !Number.isFinite(rate) || intervalHours <= 0) return null;
  return rate * (24 / intervalHours) * 365 * 100;
}

function getVenueDisplayName(venue: unknown) {
  const rawVenue = String(venue);
  const displayNames: Record<string, string> = {
    BinPerp: "Binance",
    BybitPerp: "Bybit",
    HlPerp: "Hyperliquid",
  };

  return displayNames[rawVenue] ?? rawVenue;
}

function normalizeVenueRow(row: HypeFundingVenueRow): HypeFundingVenueRow {
  return {
    ...row,
    annualizedPct: row.fundingRate === null ? null : row.annualizedPct,
    venue: getVenueDisplayName(row.venue),
  };
}

function cacheExpiresAtMs(data: HypeFundingDashboardData) {
  const expiresAt = new Date(data.cacheExpiresAt).getTime();
  return Number.isFinite(expiresAt) ? expiresAt : 0;
}

async function postHyperliquidInfo<T>(body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as HypeFundingDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (!Array.isArray(data.history) || !Array.isArray(data.venues) || expiresAt <= 0) {
      return null;
    }

    data.venues = data.venues.map(normalizeVenueRow);

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: HypeFundingDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write HYPE funding dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function buildHypeFundingDashboardData(inputs: {
  fetchedAt?: Date;
  fundingHistory: FundingHistoryInput[];
  metaAndAssetCtxs: MetaAndAssetCtxsInput;
  predictedFundings: PredictedFundingInput[];
}): HypeFundingDashboardData {
  const fetchedAt = inputs.fetchedAt ?? new Date();
  const history = inputs.fundingHistory
    .filter((row) => row.coin === "HYPE")
    .map((row) => {
      const fundingRate = asRequiredNumber(row.fundingRate);
      const premium = asNumber(row.premium);
      const time = asRequiredNumber(row.time);

      return {
        annualizedPct: annualizeFundingRate(fundingRate) ?? 0,
        fundingRate,
        premium,
        time,
      };
    })
    .filter((row) => row.time > 0)
    .sort((a, b) => a.time - b.time);

  const hypePrediction = inputs.predictedFundings.find(([coin]) => coin === "HYPE");
  const venues = (hypePrediction?.[1] ?? [])
    .map(([venue, value]) => {
      const fundingRate = asNumber(value?.fundingRate);
      const fundingIntervalHours = asNumber(value?.fundingIntervalHours);

      return {
        annualizedPct: annualizeFundingRate(fundingRate, fundingIntervalHours ?? 1),
        fundingIntervalHours,
        fundingRate,
        nextFundingTime: asNumber(value?.nextFundingTime),
        venue: getVenueDisplayName(venue),
      };
    })
    .sort((a, b) => (b.annualizedPct ?? Number.NEGATIVE_INFINITY) - (a.annualizedPct ?? Number.NEGATIVE_INFINITY));

  const [meta, contexts] = inputs.metaAndAssetCtxs;
  const hypeIndex = meta.universe?.findIndex((asset) => asset.name === "HYPE") ?? -1;
  const hypeContext = hypeIndex >= 0 ? contexts[hypeIndex] : undefined;
  const currentFunding = asNumber(hypeContext?.funding);
  const fundingRates = history.map((row) => row.fundingRate);
  const averageFundingRate = fundingRates.length > 0 ? fundingRates.reduce((sum, rate) => sum + rate, 0) / fundingRates.length : null;

  return {
    cacheExpiresAt: new Date(fetchedAt.getTime() + DASHBOARD_CACHE_MS).toISOString(),
    current: {
      annualizedPct: annualizeFundingRate(currentFunding),
      dayVolumeUsd: asNumber(hypeContext?.dayNtlVlm),
      fundingRate: currentFunding,
      markPrice: asNumber(hypeContext?.markPx),
      openInterest: asNumber(hypeContext?.openInterest),
      oraclePrice: asNumber(hypeContext?.oraclePx),
      premium: asNumber(hypeContext?.premium),
    },
    history,
    source: "Hyperliquid official info API",
    stats: {
      averageAnnualizedPct: annualizeFundingRate(averageFundingRate),
      averageFundingRate,
      highestFundingRate: fundingRates.length > 0 ? Math.max(...fundingRates) : null,
      latestFundingRate: history.at(-1)?.fundingRate ?? null,
      lowestFundingRate: fundingRates.length > 0 ? Math.min(...fundingRates) : null,
      samples: history.length,
    },
    updatedAt: fetchedAt.toISOString(),
    venues,
  };
}

export async function refreshHypeFundingDashboardData(signal?: AbortSignal): Promise<HypeFundingDashboardData> {
  const now = Date.now();
  const [fundingHistory, predictedFundings, metaAndAssetCtxs] = await Promise.all([
    postHyperliquidInfo<FundingHistoryInput[]>(
      {
        type: "fundingHistory",
        coin: "HYPE",
        startTime: now - HISTORY_LOOKBACK_MS,
      },
      signal,
    ),
    postHyperliquidInfo<PredictedFundingInput[]>({ type: "predictedFundings" }, signal),
    postHyperliquidInfo<MetaAndAssetCtxsInput>({ type: "metaAndAssetCtxs" }, signal),
  ]);

  const data = buildHypeFundingDashboardData({
    fundingHistory,
    metaAndAssetCtxs,
    predictedFundings,
  });

  cachedDashboardData = { data, expiresAt: cacheExpiresAtMs(data) };
  await writeDashboardDataToDisk(data);

  return data;
}

export async function getHypeFundingDashboardData(signal?: AbortSignal): Promise<HypeFundingDashboardData> {
  const now = Date.now();

  if (cachedDashboardData && cachedDashboardData.expiresAt > now) {
    return cachedDashboardData.data;
  }

  const diskCache = await readDashboardDataFromDisk();
  if (diskCache && diskCache.expiresAt > now) {
    cachedDashboardData = diskCache;
    return diskCache.data;
  }

  if (!pendingDashboardData) {
    pendingDashboardData = refreshHypeFundingDashboardData(signal).finally(() => {
      pendingDashboardData = null;
    });
  }

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (diskCache) {
      console.warn(`Returning stale HYPE funding dashboard data after refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      cachedDashboardData = diskCache;
      return diskCache.data;
    }

    throw error;
  }
}
