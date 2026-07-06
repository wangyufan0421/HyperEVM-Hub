import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiminalDashboard } from "@/components/dashboard/liminal-dashboard";
import { getLiminalDashboardData } from "@/lib/liminal";

export default async function LiminalProjectPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getLiminalDashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load Liminal dashboard data";
  }

  return (
    <DashboardShell activeHref="/projects/liminal">
      <LiminalDashboard data={data} error={error} />
    </DashboardShell>
  );
}
