import { refreshHyperEvmTvlDashboardData } from "@/lib/defillama-hyperevm-tvl";
import { refreshHip3DashboardData } from "@/lib/flowscan-hip3";
import { refreshHypeBuybackDashboardData } from "@/lib/hype-buyback";
import { refreshHypeEtfDashboardData } from "@/lib/hype-etf";
import { refreshHypeFundingDashboardData } from "@/lib/hype-funding";
import { refreshHip4DashboardData } from "@/lib/loris-hip4";
import { refreshLiminalDashboardData } from "@/lib/liminal";
import { refreshPrjxDashboardData } from "@/lib/prjx";
import { refreshTradeXyzDashboardData } from "@/lib/tradexyz";

const PREWARM_INTERVAL_MS = 55 * 60 * 1000;

type DashboardPrewarmState = {
  interval?: ReturnType<typeof setInterval>;
  lastFinishedAt?: string;
  lastStartedAt?: string;
  lastSummary?: DashboardRefreshSummary;
  running?: Promise<void>;
  started: boolean;
};

type DashboardPrewarmGlobal = typeof globalThis & {
  __hyperEvmDashboardPrewarm?: DashboardPrewarmState;
};

function getDashboardPrewarmState() {
  const globalStore = globalThis as DashboardPrewarmGlobal;
  globalStore.__hyperEvmDashboardPrewarm ??= { started: false };
  return globalStore.__hyperEvmDashboardPrewarm;
}

export type DashboardRefreshSummary = {
  failures: Array<{
    dashboard: string;
    error: string;
  }>;
  refreshed: string[];
};

export async function refreshDashboards(): Promise<DashboardRefreshSummary> {
  const dashboards = [
    { name: "hype-etf", refresh: refreshHypeEtfDashboardData },
    { name: "hype-buyback", refresh: refreshHypeBuybackDashboardData },
    { name: "hype-funding", refresh: refreshHypeFundingDashboardData },
    { name: "prjx", refresh: refreshPrjxDashboardData },
    { name: "tradexyz", refresh: refreshTradeXyzDashboardData },
    { name: "liminal", refresh: refreshLiminalDashboardData },
    { name: "hyperevm-tvl", refresh: refreshHyperEvmTvlDashboardData },
    { name: "hip-3", refresh: refreshHip3DashboardData },
    { name: "hip-4", refresh: refreshHip4DashboardData },
  ];
  const results = await Promise.allSettled(dashboards.map((dashboard) => dashboard.refresh()));
  const failures = results
    .map((result, index) => ({ dashboard: dashboards[index].name, result }))
    .filter((item): item is { dashboard: string; result: PromiseRejectedResult } => item.result.status === "rejected")
    .map((item) => ({
      dashboard: item.dashboard,
      error: item.result.reason instanceof Error ? item.result.reason.message : String(item.result.reason),
    }));
  const refreshed = results
    .map((result, index) => ({ dashboard: dashboards[index].name, result }))
    .filter((item) => item.result.status === "fulfilled")
    .map((item) => item.dashboard);

  if (failures.length > 0) {
    console.warn(`Dashboard prewarm finished with ${failures.length} failed request(s).`);
  }

  return { failures, refreshed };
}

export function refreshDashboardsTracked() {
  const state = getDashboardPrewarmState();
  if (state.running) {
    return state.running;
  }

  state.lastStartedAt = new Date().toISOString();
  state.running = refreshDashboards()
    .then((summary) => {
      state.lastSummary = summary;
      state.lastFinishedAt = new Date().toISOString();
    })
    .finally(() => {
      state.running = undefined;
    });

  return state.running;
}

export function startDashboardPrewarm() {
  const state = getDashboardPrewarmState();
  if (state.started) {
    return;
  }

  state.started = true;
  refreshDashboardsTracked();

  state.interval = setInterval(() => {
    refreshDashboardsTracked();
  }, PREWARM_INTERVAL_MS);

  state.interval.unref?.();
}

export function getDashboardPrewarmStatus() {
  const state = getDashboardPrewarmState();

  return {
    intervalMs: PREWARM_INTERVAL_MS,
    lastFinishedAt: state?.lastFinishedAt ?? null,
    lastStartedAt: state?.lastStartedAt ?? null,
    lastSummary: state?.lastSummary ?? null,
    running: Boolean(state?.running),
    started: Boolean(state?.started),
  };
}
