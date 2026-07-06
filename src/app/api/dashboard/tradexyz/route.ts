import { getTradeXyzDashboardData } from "@/lib/tradexyz";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTradeXyzDashboardData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load tradeXYZ dashboard data",
      },
      { status: 502 },
    );
  }
}
