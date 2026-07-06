const DEFILLAMA_CHAIN = "Hyperliquid L1";
const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const REVALIDATE_SECONDS = 60 * 60;

type DefiLlamaProtocol = {
  name?: string;
  displayName?: string;
  protocolType?: string;
  total24h?: unknown;
};

type DefiLlamaOverview = {
  allChains?: unknown[];
  total24h?: unknown;
  protocols?: DefiLlamaProtocol[];
};

export type DexChainRank = {
  isHyperliquid: boolean;
  name: string;
  rank: number;
  volume24h: number;
};

export type HyperEvmEcosystemMetrics = {
  chainFees24h: number | null;
  chainRevenue24h: number | null;
  appFees24h: number | null;
  appRevenue24h: number | null;
  dexChainRankings: DexChainRank[];
  dexVolume24h: number | null;
  hyperliquidDexRank: number | null;
  updatedAt: string;
};

export type HyperEvmMetricInputs = {
  feesOverview: DefiLlamaOverview;
  revenueOverview: DefiLlamaOverview;
  dexOverview: DefiLlamaOverview;
  dexChainOverviews?: Record<string, DefiLlamaOverview>;
  globalDexOverview?: DefiLlamaOverview;
};

function asFiniteNumber(value: unknown) {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isChainProtocol(protocol: DefiLlamaProtocol) {
  return protocol.protocolType === "chain" || protocol.name === DEFILLAMA_CHAIN || protocol.displayName === DEFILLAMA_CHAIN;
}

function getChainTotal24h(overview: DefiLlamaOverview) {
  const chainProtocol = overview.protocols?.find(isChainProtocol);
  return asFiniteNumber(chainProtocol?.total24h) ?? asFiniteNumber(overview.total24h);
}

function getAppTotal24h(overview: DefiLlamaOverview) {
  const appProtocols = overview.protocols?.filter((protocol) => !isChainProtocol(protocol)) ?? [];
  if (appProtocols.length === 0) {
    return null;
  }

  return appProtocols.reduce((total, protocol) => total + (asFiniteNumber(protocol.total24h) ?? 0), 0);
}

function getAllChains(overview: DefiLlamaOverview) {
  return [...(overview.allChains ?? [])].filter((chain): chain is string => typeof chain === "string" && chain.trim().length > 0);
}

function getRankingChainNames(overview: DefiLlamaOverview) {
  const allChains = getAllChains(overview);
  const topChains = allChains.slice(0, 10);
  return topChains.includes(DEFILLAMA_CHAIN) ? topChains : [...topChains, DEFILLAMA_CHAIN];
}

function buildDexChainRankings(globalDexOverview: DefiLlamaOverview | undefined, dexChainOverviews: Record<string, DefiLlamaOverview> | undefined) {
  const allChains = getAllChains(globalDexOverview ?? {});
  if (allChains.length === 0 || !dexChainOverviews) {
    return {
      dexChainRankings: [],
      hyperliquidDexRank: null,
    };
  }

  const rankedChains = allChains
    .flatMap((name) => {
      const volume24h = asFiniteNumber(dexChainOverviews[name]?.total24h);
      if (volume24h === null) return [];

      return {
        isHyperliquid: name === DEFILLAMA_CHAIN,
        name,
        volume24h,
      };
    })
    .sort((a, b) => b.volume24h - a.volume24h)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const hyperliquidRow = rankedChains.find((row) => row.isHyperliquid);
  const dexChainRankings = rankedChains.slice(0, 10).map((row) => ({
    isHyperliquid: row.isHyperliquid,
    name: row.name,
    rank: row.rank,
    volume24h: row.volume24h,
  }));

  if (!dexChainRankings.some((row) => row.isHyperliquid) && hyperliquidRow && hyperliquidRow.rank <= 10) {
    dexChainRankings.push(hyperliquidRow);
    dexChainRankings.sort((a, b) => a.rank - b.rank);
  }

  return {
    dexChainRankings,
    hyperliquidDexRank: hyperliquidRow?.rank ?? null,
  };
}

export function extractHyperEvmMetrics(inputs: HyperEvmMetricInputs): Omit<HyperEvmEcosystemMetrics, "updatedAt"> {
  const { dexChainRankings, hyperliquidDexRank } = buildDexChainRankings(inputs.globalDexOverview, inputs.dexChainOverviews);

  return {
    chainFees24h: getChainTotal24h(inputs.feesOverview),
    chainRevenue24h: getChainTotal24h(inputs.revenueOverview),
    appFees24h: getAppTotal24h(inputs.feesOverview),
    appRevenue24h: getAppTotal24h(inputs.revenueOverview),
    dexChainRankings,
    dexVolume24h: asFiniteNumber(inputs.dexOverview.total24h),
    hyperliquidDexRank,
  };
}

async function fetchDefiLlamaOverview(kind: "dexs" | "fees", chain?: string, dataType?: string, signal?: AbortSignal) {
  const path = chain ? `/overview/${kind}/${encodeURIComponent(chain)}` : `/overview/${kind}`;
  const url = new URL(path, DEFILLAMA_BASE_URL);
  url.searchParams.set("excludeTotalDataChart", "true");
  url.searchParams.set("excludeTotalDataChartBreakdown", "true");
  if (dataType) {
    url.searchParams.set("dataType", dataType);
  }

  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal,
  });

  if (!response.ok) {
    throw new Error(`DefiLlama ${kind} overview responded with ${response.status}`);
  }

  return response.json() as Promise<DefiLlamaOverview>;
}

export async function getHyperEvmEcosystemMetrics(signal?: AbortSignal): Promise<HyperEvmEcosystemMetrics> {
  const [feesOverview, revenueOverview, dexOverview, globalDexOverview] = await Promise.all([
    fetchDefiLlamaOverview("fees", DEFILLAMA_CHAIN, "dailyFees", signal),
    fetchDefiLlamaOverview("fees", DEFILLAMA_CHAIN, "dailyRevenue", signal),
    fetchDefiLlamaOverview("dexs", DEFILLAMA_CHAIN, undefined, signal),
    fetchDefiLlamaOverview("dexs", undefined, undefined, signal),
  ]);
  const rankingChainNames = getRankingChainNames(globalDexOverview);
  const dexChainEntries = await Promise.all(
    rankingChainNames.map(async (chain) => [chain, await fetchDefiLlamaOverview("dexs", chain, undefined, signal)] as const),
  );

  return {
    ...extractHyperEvmMetrics({
      dexChainOverviews: Object.fromEntries(dexChainEntries),
      feesOverview,
      dexOverview,
      globalDexOverview,
      revenueOverview,
    }),
    updatedAt: new Date().toISOString(),
  };
}
