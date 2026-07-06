import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TradeXyzDashboard } from "@/components/dashboard/tradexyz-dashboard";
import { getTradeXyzDashboardData } from "@/lib/tradexyz";
import { TRADE_XYZ_DASHBOARD_COPY } from "@/lib/tradexyz-copy";

export default async function TradeXyzProjectPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getTradeXyzDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : TRADE_XYZ_DASHBOARD_COPY.loadError;
  }

  return (
    <DashboardShell activeHref="/projects/tradexyz">
      <TradeXyzDashboard data={data} error={error} />
    </DashboardShell>
  );
}
