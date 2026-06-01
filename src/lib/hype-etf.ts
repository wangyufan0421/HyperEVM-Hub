const HYPURRINTEL_BASE_URL = "https://hypurrintel.xyz";
const HYPE_ETF_PAGE_PATH = "/hype-spot-etfs";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const DISK_CACHE_FILE = ".next/cache/hyper-evm-hub/hype-etf-dashboard.json";

type HypurrStaticCache = {
  data: Array<Record<string, string>>;
  fetchedAt?: string;
  headers?: string[];
  lastUpdate?: string;
  rowCount?: number;
  type?: string;
};

export type HypeEtfFlowRow = {
  date: string;
  isoDate: string;
  bhyp: number | null;
  thyp: number | null;
  total: number;
  cumulativeTotal: number;
};

export type HypeEtfDashboardData = {
  cacheExpiresAt: string;
  fetchedAt: string;
  rows: HypeEtfFlowRow[];
  source: string;
  totals: {
    averageDailyFlow: number;
    bhypFlow: number;
    cumulativeFlow: number;
    latestBhyp: number | null;
    latestDate: string;
    latestThyp: number | null;
    latestTotal: number;
    positiveDays: number;
    thypFlow: number;
  };
  updatedAt: string;
};

let cachedDashboardData: { data: HypeEtfDashboardData; expiresAt: number } | null = null;
let pendingDashboardData: Promise<HypeEtfDashboardData> | null = null;

function parseFlowValue(value: unknown) {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }

  const normalized = String(value).trim();
  const parsed = Number(normalized.replace(/[,*]/g, "").replace(/[()]/g, ""));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return normalized.startsWith("(") ? -parsed : parsed;
}

function roundFlow(value: number) {
  return Math.round(value * 10) / 10;
}

function parseDate(value: string) {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = Number(parts[0]);
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[1]);
    const year = Number(parts[2]);
    if (Number.isFinite(day) && month >= 0 && Number.isFinite(year)) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  return new Date(value);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractQuotedString(objectLiteral: string, key: string) {
  const match = new RegExp(`${escapeRegex(key)}:"([^"]*)"`).exec(objectLiteral);
  return match?.[1] ?? "";
}

function extractStaticCache(moduleCode: string): HypurrStaticCache {
  const dataMatch = /data:\[([\s\S]*?)\],rowCount:/.exec(moduleCode);
  if (!dataMatch) {
    throw new Error("Unable to locate HYPE ETF static rows");
  }

  const data = [...dataMatch[1].matchAll(/\{([^{}]+)\}/g)].map((match) => ({
    Date: extractQuotedString(match[1], "Date"),
    BHYP: extractQuotedString(match[1], "BHYP"),
    THYP: extractQuotedString(match[1], "THYP"),
    Total: extractQuotedString(match[1], "Total"),
  }));

  const fetchedAt = /fetchedAt:"([^"]+)"/.exec(moduleCode)?.[1];
  const lastUpdate = /lastUpdate:"([^"]+)"/.exec(moduleCode)?.[1];

  return {
    data,
    fetchedAt,
    headers: ["Date", "BHYP", "THYP", "Total"],
    lastUpdate,
    rowCount: data.length,
    type: "hype",
  };
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

async function discoverHypeStaticCacheUrl(signal?: AbortSignal) {
  const html = await fetchText(`${HYPURRINTEL_BASE_URL}${HYPE_ETF_PAGE_PATH}`, signal);
  const indexPath = /src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
  if (!indexPath) {
    throw new Error("Unable to discover HypurrIntel index bundle");
  }

  const indexCode = await fetchText(`${HYPURRINTEL_BASE_URL}${indexPath}`, signal);
  const hypeDashboardPath = /assets\/HYPESpotETFs-[^"]+?\.js/.exec(indexCode)?.[0];
  if (!hypeDashboardPath) {
    throw new Error("Unable to discover HYPE ETF dashboard bundle");
  }

  const dashboardCode = await fetchText(`${HYPURRINTEL_BASE_URL}/${hypeDashboardPath}`, signal);
  const cachePath = /hypePriceCache-[^"]+?\.js/.exec(dashboardCode)?.[0];
  if (!cachePath) {
    throw new Error("Unable to discover HYPE ETF static cache bundle");
  }

  return `${HYPURRINTEL_BASE_URL}/assets/${cachePath}`;
}

export function buildHypeEtfDashboardData(staticCache: HypurrStaticCache): HypeEtfDashboardData {
  let cumulativeTotal = 0;
  const rows = staticCache.data
    .map((row) => {
      const date = row.Date ?? "";
      const parsedDate = parseDate(date);
      const bhyp = parseFlowValue(row.BHYP);
      const thyp = parseFlowValue(row.THYP);
      const total = parseFlowValue(row.Total) ?? (bhyp ?? 0) + (thyp ?? 0);

      return {
        bhyp,
        date,
        isoDate: Number.isNaN(parsedDate.getTime()) ? date : toIsoDate(parsedDate),
        thyp,
        total,
      };
    })
    .filter((row) => row.date && row.isoDate)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
    .map((row) => {
      cumulativeTotal += row.total;
      return {
        ...row,
        cumulativeTotal: roundFlow(cumulativeTotal),
      };
    });

  const latest = rows.at(-1);
  const bhypFlow = rows.reduce((total, row) => total + (row.bhyp ?? 0), 0);
  const thypFlow = rows.reduce((total, row) => total + (row.thyp ?? 0), 0);
  const fetchedAt = staticCache.fetchedAt ?? staticCache.lastUpdate ?? new Date().toISOString();
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;

  return {
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    fetchedAt,
    rows,
    source: "Farside ETF flow data via HypurrIntel public static cache",
    totals: {
      averageDailyFlow: rows.length > 0 ? roundFlow(cumulativeTotal / rows.length) : 0,
      bhypFlow: roundFlow(bhypFlow),
      cumulativeFlow: roundFlow(cumulativeTotal),
      latestBhyp: latest?.bhyp ?? null,
      latestDate: latest?.date ?? "--",
      latestThyp: latest?.thyp ?? null,
      latestTotal: latest?.total ?? 0,
      positiveDays: rows.filter((row) => row.total > 0).length,
      thypFlow: roundFlow(thypFlow),
    },
    updatedAt: new Date().toISOString(),
  };
}

function cacheExpiresAtMs(data: HypeEtfDashboardData) {
  const expiresAt = new Date(data.cacheExpiresAt).getTime();
  return Number.isFinite(expiresAt) ? expiresAt : 0;
}

async function readDashboardDataFromDisk() {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), DISK_CACHE_FILE), "utf8");
    const data = JSON.parse(raw) as HypeEtfDashboardData;
    const expiresAt = cacheExpiresAtMs(data);

    if (!Array.isArray(data.rows) || expiresAt <= 0) {
      return null;
    }

    return { data, expiresAt };
  } catch {
    return null;
  }
}

async function writeDashboardDataToDisk(data: HypeEtfDashboardData) {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const cachePath = join(process.cwd(), DISK_CACHE_FILE);
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`Unable to write HYPE ETF dashboard disk cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function loadHypeEtfDashboardData(signal?: AbortSignal) {
  const cacheUrl = await discoverHypeStaticCacheUrl(signal);
  const cacheModule = await fetchText(cacheUrl, signal);
  return buildHypeEtfDashboardData(extractStaticCache(cacheModule));
}

export async function refreshHypeEtfDashboardData(signal?: AbortSignal): Promise<HypeEtfDashboardData> {
  const loadedData = await loadHypeEtfDashboardData(signal);
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;
  const data = {
    ...loadedData,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
  cachedDashboardData = { data, expiresAt };
  await writeDashboardDataToDisk(data);
  return data;
}

export async function getHypeEtfDashboardData(signal?: AbortSignal): Promise<HypeEtfDashboardData> {
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

  pendingDashboardData ??= refreshHypeEtfDashboardData(signal).finally(() => {
    pendingDashboardData = null;
  });

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (cachedDashboardData) {
      console.warn(`Returning stale HYPE ETF dashboard data after refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      return cachedDashboardData.data;
    }

    throw error;
  }
}
