import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Hip3Dashboard } from "@/components/dashboard/hip3-dashboard";
import { getHip3DashboardData } from "@/lib/flowscan-hip3";

export const dynamic = "force-dynamic";

export default async function Hip3DashboardPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getHip3DashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load HIP-3 dashboard data";
  }

  return (
    <DashboardShell activeHref="/dashboard/hip-3">
      <Hip3Dashboard data={data} error={error} />
    </DashboardShell>
  );
}
