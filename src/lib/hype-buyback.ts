const HYPURRINTEL_BASE_URL = "https://hypurrintel.xyz";
const HYPE_BUYBACK_PAGE_PATH = "/hype-buyback";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/hype-buyback-dashboard.json";

type RawBuybackRow = {
  a?: number;
  d?: string;
  h?: number;
  p?: number;
  u?: number;
};

export type HypeBuybackRow = {
  avgPrice: number;
  cumulativeHype: number;
  cumulativeUsd: number;
  date: string;
  hypeAmount: number;
  price: number;
  usdAmount: number;
};

export type HypeBuybackDashboardData = {
  cacheExpiresAt: string;
  rows: HypeBuybackRow[];
  source: string;
  totals: {
    averageDailyUsd: number;
    cumulativeHype: number;
    cumulativeUsd: number;
    latestAvgPrice: number;
    latestDate: string;
    latestHype: number;
    latestUsd: number;
    maxDailyUsd: number;
    records: number;
  };
  updatedAt: string;
};

let cachedDashboardData: { data: HypeBuybackDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<HypeBuybackDashboardData> | null = null;

function asNumber(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function fetchText(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "text/html,application/javascript,text/plain,*/*",
      "user-agent": "Mozilla/5.0 (compatible; HyperEVMHub/1.0)",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${url} responded with ${response.status}`);
  }

  return response.text();
}

async function discoverHypeRawDataUrl(signal?: AbortSignal) {
  const html = await fetchText(`${HYPURRINTEL_BASE_URL}${HYPE_BUYBACK_PAGE_PATH}`, signal);
  const indexPath = /src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
  if (!indexPath) {
    throw new Error("Unable to discover HypurrIntel index bundle");
  }

  const indexCode = await fetchText(`${HYPURRINTEL_BASE_URL}${indexPath}`, signal);
  const buybackPath = /assets\/HYPEBuybackDashboard-[^"]+?\.js/.exec(indexCode)?.[0];
  if (!buybackPath) {
    throw new Error("Unable to discover HYPE buyback dashboard bundle");
  }

  const dashboardCode = await fetchText(`${HYPURRINTEL_BASE_URL}/${buybackPath}`, signal);
  const rawDataPath = /hypeRawData-[^"]+?\.js/.exec(dashboardCode)?.[0];
  if (!rawDataPath) {
    throw new Error("Unable to discover HYPE buyback raw data bundle");
  }

  return `${HYPURRINTEL_BASE_URL}/assets/${rawDataPath}`;
}

function extractRawRows(moduleCode: string): RawBuybackRow[] {
  const dataMatch = /const p=\[([\s\S]*?)\],d=p\.map/.exec(moduleCode);
  if (!dataMatch) {
    throw new Error("Unable to locate HYPE buyback raw rows");
  }

  return [...dataMatch[1].matchAll(/\{([^{}]+)\}/g)].map((match) => {
    const objectLiteral = match[1];
    const get = (key: string) => {
      const value = new RegExp(`${key}:([^,}]+)`).exec(objectLiteral)?.[1];
      return asNumber(value);
    };

    return {
      a: get("a"),
      d: /d:"([^"]+)"/.exec(objectLiteral)?.[1] ?? "",
      h: get("h"),
      p: get("p"),
      u: get("u"),
    };
  });
}

export function buildHypeBuybackDashboardData(rawRows: RawBuybackRow[]): HypeBuybackDashboardData {
  let cumulativeHype = 0;
  let cumulativeUsd = 0;

  const rows = rawRows
    .filter((row) => row.d)
    .sort((a, b) => String(a.d).localeCompare(String(b.d)))
    .map((row) => {
      const hypeAmount = round(asNumber(row.h), 2);
      const usdAmount = round(asNumber(row.u), 2);
      cumulativeHype += hypeAmount;
      cumulativeUsd += usdAmount;

      return {
        avgPrice: round(asNumber(row.a), 2),
        cumulativeHype: round(cumulativeHype, 2),
        cumulativeUsd: round(cumulativeUsd, 2),
        date: row.d ?? "",
        hypeAmount,
        price: round(asNumber(row.p), 2),
        usdAmount,
      };
    });

  const latest = rows.at(-1);
  const maxDailyUsd = rows.reduce((max, row) => Math.max(max, row.usdAmount), 0);
  const totalUsd = latest?.cumulativeUsd ?? 0;
  const totalHype = latest?.cumulativeHype ?? 0;
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;

  return {
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    rows,
    source: "HypurrIntel public static buyback cache",
    totals: {
      averageDailyUsd: rows.length > 0 ? round(totalUsd / rows.length, 2) : 0,
      cumulativeHype: totalHype,
      cumulativeUsd: totalUsd,
      latestAvgPrice: latest?.avgPrice ?? 0,
      latestDate: latest?.date ?? "--",
      latestHype: latest?.hypeAmount ?? 0,
      latestUsd: latest?.usdAmount ?? 0,
      maxDailyUsd,
      records: rows.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

function cacheExpiresAtMs(data: HypeBuybackDashboardData) {
  const expiresAt = new Date(data.cacheExpiresAt).getTime();
  return Number.isFinite(expiresAt) ? expiresAt : 0;
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as HypeBuybackDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (!Array.isArray(data.rows) || expiresAt <= 0) {
      return null;
    }

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: HypeBuybackDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write HYPE buyback dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function loadHypeBuybackDashboardData(signal?: AbortSignal) {
  const rawDataUrl = await discoverHypeRawDataUrl(signal);
  const rawDataModule = await fetchText(rawDataUrl, signal);
  return buildHypeBuybackDashboardData(extractRawRows(rawDataModule));
}

export async function refreshHypeBuybackDashboardData(signal?: AbortSignal): Promise<HypeBuybackDashboardData> {
  const loadedData = await loadHypeBuybackDashboardData(signal);
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;
  const data = {
    ...loadedData,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
  cachedDashboardData = { data, expiresAt };
  await writeDashboardDataToDisk(data);
  return data;
}

export async function getHypeBuybackDashboardData(signal?: AbortSignal): Promise<HypeBuybackDashboardData> {
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

  pendingDashboardData ??= refreshHypeBuybackDashboardData(signal).finally(() => {
    pendingDashboardData = null;
  });

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (cachedDashboardData) {
      console.warn(`Returning stale HYPE buyback dashboard data after refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      return cachedDashboardData.data;
    }

    throw error;
  }
}
