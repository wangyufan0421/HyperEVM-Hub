import { getHypeFundingDashboardData } from "@/lib/hype-funding";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const data = await getHypeFundingDashboardData(request.signal);

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HYPE funding dashboard data",
      },
      { status: 502 },
    );
  }
}
