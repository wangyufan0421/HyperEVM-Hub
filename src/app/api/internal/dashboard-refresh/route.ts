import { getDashboardPrewarmStatus, refreshDashboardsTracked } from "@/lib/dashboard-prewarm";
import { NextResponse } from "next/server";

function isAuthorized(request: Request) {
  const secret = process.env.DASHBOARD_REFRESH_SECRET;
  if (!secret) {
    return true;
  }

  return request.headers.get("x-dashboard-refresh-secret") === secret;
}

export async function GET() {
  return NextResponse.json(getDashboardPrewarmStatus(), {
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized dashboard refresh request" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  await refreshDashboardsTracked();
  const status = getDashboardPrewarmStatus();

  return NextResponse.json(
    {
      finishedAt: new Date().toISOString(),
      startedAt,
      ...(status.lastSummary ?? { failures: [], refreshed: [] }),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
