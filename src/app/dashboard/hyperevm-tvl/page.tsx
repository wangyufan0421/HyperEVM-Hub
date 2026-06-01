import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HyperEvmTvlDashboard } from "@/components/dashboard/hyperevm-tvl-dashboard";
import { getHyperEvmTvlDashboardData } from "@/lib/defillama-hyperevm-tvl";

export const dynamic = "force-dynamic";

export default async function HyperEvmTvlDashboardPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getHyperEvmTvlDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load HyperEVM TVL dashboard data";
  }

  return (
    <DashboardShell activeHref="/dashboard/hyperevm-tvl">
      <HyperEvmTvlDashboard data={data} error={error} />
    </DashboardShell>
  );
}
