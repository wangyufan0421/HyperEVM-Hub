const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const DASHBOARD_CACHE_MS = 60 * 1000;
const DASHBOARD_STALE_RETRY_MS = 5 * 60 * 1000;

type HyperliquidOutcomeMetaResponse = {
  outcomes?: Array<{
    outcome?: unknown;
    name?: string;
    description?: string;
    quoteToken?: string;
    sideSpecs?: Array<{ name?: string }>;
  }>;
};

type HyperliquidAllMidsResponse = Record<string, string>;

export type Hip4PriceSide = {
  side: number;
  name: string;
  coin: string;
  price: number;
  probabilityPct: number;
};

export type Hip4OutcomePrice = {
  outcomeId: number;
  title: string;
  description: string;
  quoteToken: string;
  sides: Hip4PriceSide[];
};

export type Hip4DashboardData = {
  updatedAt: string;
  cacheExpiresAt: string;
  source: string;
  stale: boolean;
  overview: {
    outcomesCount: number;
    pricedSidesCount: number;
    quoteTokensCount: number;
    averageYesPrice: number;
    averageNoPrice: number;
    highestYesPrice: number;
    highestNoPrice: number;
  };
  outcomes: Hip4OutcomePrice[];
  topYesPrices: Hip4OutcomePrice[];
  topNoPrices: Hip4OutcomePrice[];
};

let cachedDashboardData: { data: Hip4DashboardData; expiresAt: number } | null = null;
let lastSuccessfulDashboardData: Hip4DashboardData | null = null;
let pendingDashboardData: Promise<Hip4DashboardData> | null = null;

function asInteger(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? Math.trunc(numberValue) : 0;
}

function asPrice(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sideCoin(outcomeId: number, side: number) {
  return `#${outcomeId}${side}`;
}

function sideName(sideSpec: { name?: string } | undefined, side: number) {
  const name = sideSpec?.name?.trim();
  if (name) {
    return name.toUpperCase() === "YES" || name.toUpperCase() === "NO" ? name.toUpperCase() : name;
  }
  return side === 0 ? "YES" : "NO";
}

export function buildHip4DashboardData(meta: HyperliquidOutcomeMetaResponse, mids: HyperliquidAllMidsResponse, options: { stale?: boolean } = {}): Hip4DashboardData {
  const outcomes = [...(meta.outcomes ?? [])]
    .map((outcome): Hip4OutcomePrice | null => {
      const outcomeId = asInteger(outcome.outcome);
      if (!outcomeId) {
        return null;
      }

      const sides = (outcome.sideSpecs ?? [{ name: "YES" }, { name: "NO" }])
        .map((sideSpec, side): Hip4PriceSide | null => {
          const coin = sideCoin(outcomeId, side);
          const price = asPrice(mids[coin]);
          if (price === null) {
            return null;
          }

          return {
            side,
            name: sideName(sideSpec, side),
            coin,
            price,
            probabilityPct: price * 100,
          };
        })
        .filter((side): side is Hip4PriceSide => Boolean(side));

      return {
        outcomeId,
        title: outcome.name?.trim() || `Outcome ${outcomeId}`,
        description: outcome.description?.trim() ?? "",
        quoteToken: outcome.quoteToken?.trim() || "USDC",
        sides,
      };
    })
    .filter((outcome): outcome is Hip4OutcomePrice => Boolean(outcome))
    .sort((a, b) => a.outcomeId - b.outcomeId);

  const yesPrices = outcomes.map((outcome) => outcome.sides.find((side) => side.side === 0)?.price ?? 0).filter((price) => price > 0);
  const noPrices = outcomes.map((outcome) => outcome.sides.find((side) => side.side === 1)?.price ?? 0).filter((price) => price > 0);
  const quoteTokens = new Set(outcomes.map((outcome) => outcome.quoteToken));
  const expiresAt = Date.now() + DASHBOARD_CACHE_MS;

  return {
    updatedAt: new Date().toISOString(),
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    source: "Hyperliquid official Info API",
    stale: options.stale ?? false,
    overview: {
      outcomesCount: outcomes.length,
      pricedSidesCount: outcomes.reduce((count, outcome) => count + outcome.sides.length, 0),
      quoteTokensCount: quoteTokens.size,
      averageYesPrice: average(yesPrices),
      averageNoPrice: average(noPrices),
      highestYesPrice: Math.max(...yesPrices, 0),
      highestNoPrice: Math.max(...noPrices, 0),
    },
    outcomes,
    topYesPrices: [...outcomes].sort((a, b) => (b.sides.find((side) => side.side === 0)?.price ?? 0) - (a.sides.find((side) => side.side === 0)?.price ?? 0)).slice(0, 12),
    topNoPrices: [...outcomes].sort((a, b) => (b.sides.find((side) => side.side === 1)?.price ?? 0) - (a.sides.find((side) => side.side === 1)?.price ?? 0)).slice(0, 12),
  };
}

async function fetchHyperliquidInfo<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid info ${String(body.type)} responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function loadHip4DashboardData(signal?: AbortSignal): Promise<Hip4DashboardData> {
  const [meta, mids] = await Promise.all([
    fetchHyperliquidInfo<HyperliquidOutcomeMetaResponse>({ type: "outcomeMeta" }, signal),
    fetchHyperliquidInfo<HyperliquidAllMidsResponse>({ type: "allMids" }, signal),
  ]);

  return buildHip4DashboardData(meta, mids);
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
