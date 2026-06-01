import { getHypeBuybackDashboardData } from "@/lib/hype-buyback";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getHypeBuybackDashboardData();

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HYPE buyback dashboard data",
      },
      { status: 502 },
    );
  }
}
