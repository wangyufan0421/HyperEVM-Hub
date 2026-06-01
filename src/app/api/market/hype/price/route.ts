import { getHypePrice } from "@/lib/hype-market-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(
      await getHypePrice(),
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load HYPE price",
      },
      { status: 502 },
    );
  }
}
