import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PrjxDashboard } from "@/components/dashboard/prjx-dashboard";
import { PRJX_DASHBOARD_COPY } from "@/lib/prjx-copy";
import { getPrjxDashboardData } from "@/lib/prjx";

export default async function PrjxProjectPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getPrjxDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : PRJX_DASHBOARD_COPY.loadError;
  }

  return (
    <DashboardShell activeHref="/projects/prjx">
      <PrjxDashboard data={data} error={error} />
    </DashboardShell>
  );
}
