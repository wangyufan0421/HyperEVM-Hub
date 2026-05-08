import { NextResponse } from "next/server";
import { AdminProjectError, createProjectService, mapProjectFormToCreateInput } from "@/lib/admin-projects-service";
import { requireAdminWriteAuth } from "@/lib/admin-route-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const unauthorized = await requireAdminWriteAuth();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不正确" }, { status: 400 });
  }

  try {
    const service = createProjectService(prisma);
    const project = await service.createProject(
      mapProjectFormToCreateInput({
        name: String(body.name ?? ""),
        slug: String(body.slug ?? ""),
        autoResolveSlug: !String(body.slug ?? "").trim(),
        category: String(body.category ?? ""),
        categories: Array.isArray(body.categories) ? body.categories.join(";") : String(body.categories ?? body.category ?? ""),
        status: String(body.status ?? "Live"),
        shortDescription: String(body.shortDescription ?? ""),
        websiteUrl: String(body.websiteUrl ?? ""),
        logoFile: String(body.logoFile ?? ""),
        logoUrl: String(body.logoUrl ?? ""),
        twitterUrl: String(body.twitterUrl ?? ""),
        discordUrl: String(body.discordUrl ?? ""),
        docsUrl: String(body.docsUrl ?? ""),
        longDescription: String(body.longDescription ?? ""),
        coreFeatures: Array.isArray(body.coreFeatures) ? body.coreFeatures.join("\n") : String(body.coreFeatures ?? ""),
        isFeatured: Boolean(body.isFeatured),
        featuredOrder: body.featuredOrder == null ? "" : String(body.featuredOrder),
      }),
    );

    return NextResponse.json({ ok: true, project });
  } catch (error) {
    const message = error instanceof AdminProjectError || error instanceof Error
      ? error.message
      : "创建项目失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
