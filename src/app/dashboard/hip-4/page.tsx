import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Hip4Dashboard } from "@/components/dashboard/hip4-dashboard";
import { getHip4DashboardData } from "@/lib/loris-hip4";

export default async function Hip4DashboardPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await getHip4DashboardData();
  } catch (unknownError) {
    error = unknownError instanceof Error ? unknownError.message : "Unable to load HIP-4 dashboard data";
  }

  return (
    <DashboardShell activeHref="/dashboard/hip-4">
      <Hip4Dashboard data={data} error={error} />
    </DashboardShell>
  );
}
