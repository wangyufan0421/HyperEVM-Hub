import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HypeFundingDashboard } from "@/components/dashboard/hype-funding-dashboard";
import { getHypeFundingDashboardData } from "@/lib/hype-funding";

export const dynamic = "force-dynamic";

export default async function HypeFundingDashboardPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getHypeFundingDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load HYPE funding dashboard data";
  }

  return (
    <DashboardShell activeHref="/dashboard/hype-funding">
      <HypeFundingDashboard data={data} error={error} />
    </DashboardShell>
  );
}
