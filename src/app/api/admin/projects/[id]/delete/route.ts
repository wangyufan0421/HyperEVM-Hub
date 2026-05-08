import { NextResponse } from "next/server";
import { requireAdminWriteAuth } from "@/lib/admin-route-auth";
import { createProjectService } from "@/lib/admin-projects-service";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  const unauthorized = await requireAdminWriteAuth();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const service = createProjectService(prisma);
  await service.softDelete(id);
  return NextResponse.json({ ok: true, action: "soft-delete-project", id });
}
