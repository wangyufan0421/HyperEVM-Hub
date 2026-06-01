import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HypeEtfDashboard } from "@/components/dashboard/hype-etf-dashboard";
import { getHypeEtfDashboardData } from "@/lib/hype-etf";

export const dynamic = "force-dynamic";

export default async function HypeEtfDashboardPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getHypeEtfDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load HYPE ETF dashboard data";
  }

  return (
    <DashboardShell activeHref="/dashboard/hype-etf">
      <HypeEtfDashboard data={data} error={error} />
    </DashboardShell>
  );
}
