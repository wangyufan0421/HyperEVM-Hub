import { NextResponse } from "next/server";
import { requireAdminWriteAuth } from "@/lib/admin-route-auth";

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminWriteAuth();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  return NextResponse.json({ ok: true, action: "update-site-settings", payload: body });
}
