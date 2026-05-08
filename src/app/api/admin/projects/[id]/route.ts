import { NextResponse } from "next/server";
import { requireAdminWriteAuth } from "@/lib/admin-route-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminWriteAuth();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  try {
    const body = await request.json();
    if (typeof body?.isFeatured !== "boolean") {
      return NextResponse.json({ ok: false, message: "缺少有效的精选状态" }, { status: 400 });
    }

    await prisma.project.update({
      where: { id },
      data: { isFeatured: body.isFeatured },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "更新精选状态失败" }, { status: 500 });
  }
}
