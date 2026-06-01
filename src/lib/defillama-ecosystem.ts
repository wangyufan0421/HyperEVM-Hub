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
  total24h?: unknown;
  protocols?: DefiLlamaProtocol[];
};

export type HyperEvmEcosystemMetrics = {
  chainFees24h: number | null;
  chainRevenue24h: number | null;
  appFees24h: number | null;
  appRevenue24h: number | null;
  dexVolume24h: number | null;
  updatedAt: string;
};

export type HyperEvmMetricInputs = {
  feesOverview: DefiLlamaOverview;
  revenueOverview: DefiLlamaOverview;
  dexOverview: DefiLlamaOverview;
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

export function extractHyperEvmMetrics(inputs: HyperEvmMetricInputs): Omit<HyperEvmEcosystemMetrics, "updatedAt"> {
  return {
    chainFees24h: getChainTotal24h(inputs.feesOverview),
    chainRevenue24h: getChainTotal24h(inputs.revenueOverview),
    appFees24h: getAppTotal24h(inputs.feesOverview),
    appRevenue24h: getAppTotal24h(inputs.revenueOverview),
    dexVolume24h: asFiniteNumber(inputs.dexOverview.total24h),
  };
}

async function fetchDefiLlamaOverview(kind: "dexs" | "fees", dataType?: string, signal?: AbortSignal) {
  const url = new URL(`/overview/${kind}/${DEFILLAMA_CHAIN}`, DEFILLAMA_BASE_URL);
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
  const [feesOverview, revenueOverview, dexOverview] = await Promise.all([
    fetchDefiLlamaOverview("fees", "dailyFees", signal),
    fetchDefiLlamaOverview("fees", "dailyRevenue", signal),
    fetchDefiLlamaOverview("dexs", undefined, signal),
  ]);

  return {
    ...extractHyperEvmMetrics({
      feesOverview,
      revenueOverview,
      dexOverview,
    }),
    updatedAt: new Date().toISOString(),
  };
}
