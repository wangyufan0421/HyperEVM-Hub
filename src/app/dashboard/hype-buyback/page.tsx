import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HypeBuybackDashboard } from "@/components/dashboard/hype-buyback-dashboard";
import { getHypeBuybackDashboardData } from "@/lib/hype-buyback";

export const dynamic = "force-dynamic";

export default async function HypeBuybackDashboardPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getHypeBuybackDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load HYPE buyback dashboard data";
  }

  return (
    <DashboardShell activeHref="/dashboard/hype-buyback">
      <HypeBuybackDashboard data={data} error={error} />
    </DashboardShell>
  );
}
