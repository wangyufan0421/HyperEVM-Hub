import { getHip3DashboardData } from "@/lib/flowscan-hip3";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const data = await getHip3DashboardData(request.signal);

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HIP-3 dashboard data",
      },
      { status: 502 },
    );
  }
}
