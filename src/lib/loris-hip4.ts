const LORIS_API_BASE_URL = "https://api.loris.tools";
const DASHBOARD_CACHE_MS = 60 * 60 * 1000;
const DASHBOARD_STALE_RETRY_MS = 5 * 60 * 1000;

type LorisHip4Summary = {
  volume?: unknown;
  fill_count?: unknown;
  trade_count?: unknown;
  unique_traders?: unknown;
  total_fees?: unknown;
  liquidation_count?: unknown;
  total_priority_gas?: unknown;
};

type LorisHip4Outcome = {
  outcome_id?: unknown;
  volume?: unknown;
  fill_count?: unknown;
  trade_count?: unknown;
  unique_traders?: unknown;
  total_priority_gas?: unknown;
};

type LorisHip4Coin = {
  coin?: string;
  outcome_id?: unknown;
  outcome_side?: unknown;
  volume?: unknown;
  fill_count?: unknown;
  trade_count?: unknown;
  unique_traders?: unknown;
};

type LorisHip4TimeseriesRow = {
  date?: string;
  volume?: unknown;
  fill_count?: unknown;
  trade_count?: unknown;
  unique_traders?: unknown;
  total_fees?: unknown;
  liquidation_count?: unknown;
};

type LorisHip4DashboardResponse = {
  success?: boolean;
  period?: string;
  summary?: LorisHip4Summary;
  settlement_total?: LorisHip4Summary;
  by_outcome?: LorisHip4Outcome[];
  by_coin?: LorisHip4Coin[];
  timeseries?: LorisHip4TimeseriesRow[];
  settlement_timeseries?: LorisHip4TimeseriesRow[];
};

type LorisHip4OiResponse = {
  success?: boolean;
  data?: Array<{
    day?: string;
    oi_contracts?: unknown;
    oi_usd?: unknown;
    oi_change_contracts?: unknown;
    oi_change_usd?: unknown;
  }>;
};

type LorisHip4MetaResponse = {
  outcomes?: Array<{
    outcome?: unknown;
    name?: string;
    description?: string;
    sideSpecs?: Array<{ name?: string }>;
  }>;
  questions?: unknown[];
};

export type Hip4SingleSeries = {
  dates: string[];
  values: number[];
};

export type Hip4TopOutcome = {
  outcomeId: number;
  title: string;
  description: string;
  volume: number;
  trades: number;
  fills: number;
  traders: number;
};

export type Hip4TopOutcomeSide = {
  outcomeId: number;
  side: number;
  sideName: string;
  title: string;
  volume: number;
  trades: number;
  fills: number;
  traders: number;
};

export type Hip4DashboardData = {
  updatedAt: string;
  cacheExpiresAt: string;
  source: string;
  stale: boolean;
  overview: {
    totalVolume: number;
    volume24h: number;
    totalTrades: number;
    trades24h: number;
    totalFills: number;
    fills24h: number;
    totalFees: number;
    fees24h: number;
    uniqueTraders: number;
    uniqueTraders24h: number;
    liquidations: number;
    outcomesCount: number;
    questionsCount: number;
    openInterestUsd: number;
  };
  volumeSeries: Hip4SingleSeries;
  tradesSeries: Hip4SingleSeries;
  feesSeries: Hip4SingleSeries;
  oiSeries: Hip4SingleSeries;
  topOutcomes: Hip4TopOutcome[];
  topOutcomeSides: Hip4TopOutcomeSide[];
};

let cachedDashboardData: { data: Hip4DashboardData; expiresAt: number } | null = null;
let lastSuccessfulDashboardData: Hip4DashboardData | null = null;
let pendingDashboardData: Promise<Hip4DashboardData> | null = null;

function asNumber(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function asInteger(value: unknown) {
  return Math.trunc(asNumber(value));
}

function parseDescription(description: string | undefined) {
  const pairs = new Map<string, string>();
  for (const part of (description ?? "").split("|")) {
    const index = part.indexOf(":");
    if (index > 0) {
      pairs.set(part.slice(0, index).trim().toLowerCase(), part.slice(index + 1).trim());
    }
  }
  return pairs;
}

function getOutcomeTitle(meta: LorisHip4MetaResponse, outcomeId: number) {
  const outcome = meta.outcomes?.find((item) => asInteger(item.outcome) === outcomeId);
  if (!outcome) {
    return `Outcome ${outcomeId}`;
  }

  const parsed = parseDescription(outcome.description);
  const underlying = parsed.get("underlying");
  const target = parsed.get("targetprice");
  const period = parsed.get("period");
  if (underlying && target) {
    return `${underlying} ${target}${period ? ` ${period}` : ""}`;
  }

  return outcome.name?.trim() || `Outcome ${outcomeId}`;
}

function getSideName(meta: LorisHip4MetaResponse, outcomeId: number, side: number) {
  const outcome = meta.outcomes?.find((item) => asInteger(item.outcome) === outcomeId);
  const name = outcome?.sideSpecs?.[side]?.name?.trim();
  if (name) {
    return name.toUpperCase() === "YES" || name.toUpperCase() === "NO" ? name.toUpperCase() : name;
  }
  return side === 0 ? "YES" : "NO";
}

function bothSummaryValue(summary: LorisHip4Summary | undefined, settlementTotal: LorisHip4Summary | undefined, key: keyof LorisHip4Summary) {
  return asNumber(summary?.[key]) + asNumber(settlementTotal?.[key]);
}

function buildBothSeries(
  tradingRows: LorisHip4TimeseriesRow[] | undefined,
  settlementRows: LorisHip4TimeseriesRow[] | undefined,
  key: keyof LorisHip4TimeseriesRow,
): Hip4SingleSeries {
  const valuesByDate = new Map<string, number>();
  for (const row of tradingRows ?? []) {
    if (row.date) {
      valuesByDate.set(row.date, (valuesByDate.get(row.date) ?? 0) + asNumber(row[key]));
    }
  }
  for (const row of settlementRows ?? []) {
    if (row.date) {
      valuesByDate.set(row.date, (valuesByDate.get(row.date) ?? 0) + asNumber(row[key]));
    }
  }

  const dates = [...valuesByDate.keys()].sort((a, b) => a.localeCompare(b));
  return {
    dates,
    values: dates.map((date) => valuesByDate.get(date) ?? 0),
  };
}

export function buildHip4DashboardData(
  allDashboard: LorisHip4DashboardResponse,
  dayDashboard: LorisHip4DashboardResponse,
  oiResponse: LorisHip4OiResponse,
  meta: LorisHip4MetaResponse,
  options: { stale?: boolean } = {},
): Hip4DashboardData {
  const topOutcomes = [...(allDashboard.by_outcome ?? [])]
    .map((item) => {
      const outcomeId = asInteger(item.outcome_id);
      return {
        outcomeId,
        title: getOutcomeTitle(meta, outcomeId),
        description: meta.outcomes?.find((outcome) => asInteger(outcome.outcome) === outcomeId)?.description ?? "",
        volume: asNumber(item.volume),
        trades: asInteger(item.trade_count),
        fills: asInteger(item.fill_count),
        traders: asInteger(item.unique_traders),
      };
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 12);

  const topOutcomeSides = [...(allDashboard.by_coin ?? [])]
    .map((item) => {
      const outcomeId = asInteger(item.outcome_id);
      const side = asInteger(item.outcome_side);
      return {
        outcomeId,
        side,
        sideName: getSideName(meta, outcomeId, side),
        title: getOutcomeTitle(meta, outcomeId),
        volume: asNumber(item.volume),
        trades: asInteger(item.trade_count),
        fills: asInteger(item.fill_count),
        traders: asInteger(item.unique_traders),
      };
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  const oiRows = [...(oiResponse.data ?? [])].filter((row) => row.day).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  const openInterestUsd = asNumber(oiRows.at(-1)?.oi_usd);

  return {
    updatedAt: new Date().toISOString(),
    cacheExpiresAt: new Date(Date.now() + DASHBOARD_CACHE_MS).toISOString(),
    source: "Loris Tools public API",
    stale: options.stale ?? false,
    overview: {
      totalVolume: bothSummaryValue(allDashboard.summary, allDashboard.settlement_total, "volume"),
      volume24h: bothSummaryValue(dayDashboard.summary, dayDashboard.settlement_total, "volume"),
      totalTrades: Math.trunc(bothSummaryValue(allDashboard.summary, allDashboard.settlement_total, "trade_count")),
      trades24h: Math.trunc(bothSummaryValue(dayDashboard.summary, dayDashboard.settlement_total, "trade_count")),
      totalFills: Math.trunc(bothSummaryValue(allDashboard.summary, allDashboard.settlement_total, "fill_count")),
      fills24h: Math.trunc(bothSummaryValue(dayDashboard.summary, dayDashboard.settlement_total, "fill_count")),
      totalFees: bothSummaryValue(allDashboard.summary, allDashboard.settlement_total, "total_fees"),
      fees24h: bothSummaryValue(dayDashboard.summary, dayDashboard.settlement_total, "total_fees"),
      uniqueTraders: asInteger(allDashboard.summary?.unique_traders),
      uniqueTraders24h: asInteger(dayDashboard.summary?.unique_traders),
      liquidations: asInteger(allDashboard.summary?.liquidation_count),
      outcomesCount: meta.outcomes?.length ?? allDashboard.by_outcome?.length ?? 0,
      questionsCount: meta.questions?.length ?? 0,
      openInterestUsd,
    },
    volumeSeries: buildBothSeries(allDashboard.timeseries, allDashboard.settlement_timeseries, "volume"),
    tradesSeries: buildBothSeries(allDashboard.timeseries, allDashboard.settlement_timeseries, "trade_count"),
    feesSeries: buildBothSeries(allDashboard.timeseries, allDashboard.settlement_timeseries, "total_fees"),
    oiSeries: {
      dates: oiRows.map((row) => String(row.day)),
      values: oiRows.map((row) => asNumber(row.oi_usd)),
    },
    topOutcomes,
    topOutcomeSides,
  };
}

async function fetchLorisJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${LORIS_API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      accept: "application/json,text/plain,*/*",
      "content-type": "application/json",
      origin: "https://loris.tools",
      referer: "https://loris.tools/hip4",
      "user-agent": "Mozilla/5.0 (compatible; HyperEVMHub/1.0)",
      "x-loris-auth-mode": "session",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Loris ${path} responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function loadHip4DashboardData(signal?: AbortSignal): Promise<Hip4DashboardData> {
  const [allDashboard, dayDashboard, oiResponse, meta] = await Promise.all([
    fetchLorisJson<LorisHip4DashboardResponse>("/hip4-analytics/dashboard?period=all", signal),
    fetchLorisJson<LorisHip4DashboardResponse>("/hip4-analytics/dashboard?period=1d", signal),
    fetchLorisJson<LorisHip4OiResponse>("/hip4-analytics/oi-eod?min_day=2026-05-01", signal),
    fetchLorisJson<LorisHip4MetaResponse>("/hip4-analytics/outcome-meta", signal),
  ]);

  return buildHip4DashboardData(allDashboard, dayDashboard, oiResponse, meta);
}

export async function refreshHip4DashboardData(signal?: AbortSignal): Promise<Hip4DashboardData> {
  const loadedData = await loadHip4DashboardData(signal);
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;
  const data = {
    ...loadedData,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    stale: false,
  };
  cachedDashboardData = {
    data,
    expiresAt,
  };
  lastSuccessfulDashboardData = data;

  return data;
}

export async function getHip4DashboardData(signal?: AbortSignal): Promise<Hip4DashboardData> {
  const now = Date.now();
  if (cachedDashboardData && cachedDashboardData.expiresAt > now) {
    return cachedDashboardData.data;
  }

  pendingDashboardData ??= refreshHip4DashboardData(signal).finally(() => {
    pendingDashboardData = null;
  });

  try {
    return await pendingDashboardData;
  } catch (error) {
    if (lastSuccessfulDashboardData) {
      const expiresAt = Date.now() + DASHBOARD_STALE_RETRY_MS;
      const data = {
        ...lastSuccessfulDashboardData,
        cacheExpiresAt: new Date(expiresAt).toISOString(),
        stale: true,
      };
      cachedDashboardData = {
        data,
        expiresAt,
      };
      return data;
    }
    throw error;
  }
}
