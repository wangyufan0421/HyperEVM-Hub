const DEFAULT_BASE_URL = "http://localhost:3000";
const REFRESH_INTERVAL_MS = 55 * 60 * 1000;
const READY_TIMEOUT_MS = 3 * 60 * 1000;
const DASHBOARD_PAGE_PATHS = [
  "/dashboard/hype-etf",
  "/dashboard/hype-buyback",
  "/dashboard/hyperevm-tvl",
  "/dashboard/hip-3",
  "/dashboard/hip-4",
  "/dashboard/prjx",
  "/projects/tradexyz",
  "/projects/liminal",
];

const baseUrl = process.env.DASHBOARD_REFRESH_URL ?? DEFAULT_BASE_URL;
const secret = process.env.DASHBOARD_REFRESH_SECRET;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
  console.log(`[dashboard-refresh-worker] ${new Date().toISOString()} ${message}`);
}

async function fetchJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...(secret ? { "x-dashboard-refresh-secret": secret } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${text.slice(0, 240)}`);
  }

  return text ? JSON.parse(text) : null;
}

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await fetchJson("/api/internal/dashboard-refresh");
      return;
    } catch {
      await sleep(1000);
    }
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function refreshOnce() {
  const result = await fetchJson("/api/internal/dashboard-refresh", { method: "POST" });
  const failed = result.failures?.length ?? 0;
  const refreshed = result.refreshed?.join(", ") || "none";
  log(`refreshed: ${refreshed}${failed > 0 ? `; failures: ${failed}` : ""}`);
  await warmDashboardPages();
}

async function warmDashboardPages() {
  const results = await Promise.allSettled(
    DASHBOARD_PAGE_PATHS.map(async (path) => {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          accept: "text/html",
          ...(secret ? { "x-dashboard-refresh-secret": secret } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`${path} responded with ${response.status}`);
      }

      await response.arrayBuffer();
      return path;
    }),
  );
  const warmed = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.length - warmed;
  log(`warmed dashboard pages: ${warmed}/${results.length}${failed > 0 ? `; failures: ${failed}` : ""}`);
}

async function run() {
  log(`watching ${baseUrl}; interval ${Math.round(REFRESH_INTERVAL_MS / 60000)}m`);
  await waitForServer();
  await refreshOnce();

  setInterval(() => {
    refreshOnce().catch((error) => {
      log(`refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }, REFRESH_INTERVAL_MS);
}

run().catch((error) => {
  log(`fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
