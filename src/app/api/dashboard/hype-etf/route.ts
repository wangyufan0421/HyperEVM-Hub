import { getHypeEtfDashboardData } from "@/lib/hype-etf";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getHypeEtfDashboardData();

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HYPE ETF dashboard data",
      },
      { status: 502 },
    );
  }
}
