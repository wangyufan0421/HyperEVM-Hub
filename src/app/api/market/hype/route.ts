import { isHypeRange } from "@/lib/hype-market";
import { getHypeMarketData } from "@/lib/hype-market-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const range = isHypeRange(rangeParam) ? rangeParam : "1D";

  try {
    return NextResponse.json(
      await getHypeMarketData(range),
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HYPE market data",
      },
      { status: 502 },
    );
  }
}
