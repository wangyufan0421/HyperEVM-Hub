export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { startDashboardPrewarm } = await import("@/lib/dashboard-prewarm");
  startDashboardPrewarm();
}
