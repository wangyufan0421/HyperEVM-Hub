import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type EmptyDashboardPageProps = {
  activeHref: string;
  title: string;
};

export async function EmptyDashboardPage({ activeHref, title }: EmptyDashboardPageProps) {
  return (
    <DashboardShell activeHref={activeHref}>
      <div className="min-h-[calc(100vh-48px)] rounded-[14px] border border-[#06393424] bg-white/55" aria-label={title} />
    </DashboardShell>
  );
}
