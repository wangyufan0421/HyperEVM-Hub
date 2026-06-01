import { getHyperEvmTvlDashboardData } from "@/lib/defillama-hyperevm-tvl";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getHyperEvmTvlDashboardData();

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HyperEVM TVL dashboard data",
      },
      { status: 502 },
    );
  }
}
