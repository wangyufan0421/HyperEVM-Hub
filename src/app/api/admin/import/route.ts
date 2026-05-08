import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWriteAuth } from "@/lib/admin-route-auth";
import { createProjectService, mapProjectFormToCreateInput } from "@/lib/admin-projects-service";
import {
  buildImportPreview,
  parseImportContent,
  summarizeImportResult,
  type ImportNormalizedRow,
  type PreviewRow,
} from "@/lib/import-projects";

function getContentFromBody(body: unknown): { format: "csv" | "json"; content: string; mode: "preview" | "confirm"; rows?: PreviewRow[] } {
  if (!body || typeof body !== "object") {
    throw new Error("文件格式不正确");
  }

  const payload = body as Record<string, unknown>;
  const mode = payload.mode === "confirm" ? "confirm" : "preview";
  const format = payload.format === "json" ? "json" : "csv";
  const content = typeof payload.content === "string" ? payload.content : "";
  const rows = Array.isArray(payload.rows) ? (payload.rows as PreviewRow[]) : undefined;

  return { mode, format, content, rows };
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function toProjectFormInput(normalized: ImportNormalizedRow) {
  return {
    name: normalized.name,
    slug: normalized.slug,
    autoResolveSlug: true,
    categories: normalized.categories.join(";"),
    category: normalized.category,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    websiteUrl: normalized.websiteUrl,
    logoUrl: normalized.logoUrl ?? undefined,
    twitterUrl: normalized.twitterUrl ?? undefined,
    discordUrl: normalized.discordUrl ?? undefined,
    docsUrl: normalized.docsUrl ?? undefined,
    longDescription: normalized.longDescription ?? undefined,
    coreFeatures: normalized.coreFeatures.join("\n"),
    targetUsers: normalized.targetUsers.join("\n"),
    riskNotes: normalized.riskNotes.join("\n"),
    isFeatured: normalized.isFeatured,
    featuredOrder: normalized.featuredOrder?.toString() ?? "",
  };
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminWriteAuth();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "文件格式不正确" }, { status: 400 });
  }

  try {
    const { mode, format, content, rows } = getContentFromBody(body);
    const service = createProjectService(prisma);

    if (mode === "preview") {
      const rawRows = parseImportContent({ format, content });
      const existingProjects = await prisma.project.findMany({
        select: { name: true, websiteUrl: true, slug: true, isDeleted: true },
      });
      const preview = buildImportPreview({ rows: rawRows, existingProjects });
      return NextResponse.json({ ok: true, preview });
    }

    const previewRows = rows ?? [];
    if (previewRows.length === 0 || !previewRows.some((row) => row.canImport)) {
      return NextResponse.json({ ok: false, message: "没有可导入项目" }, { status: 400 });
    }

    let success = 0;
    let skipped = 0;
    let failed = 0;
    const failureReasons: Array<{ rowNumber: number; name: string; reason: string }> = [];

    const existingProjects = await prisma.project.findMany({
      where: { isDeleted: false },
      select: { name: true, websiteUrl: true, slug: true },
    });
    const deletedProjects = await prisma.project.findMany({
      where: { isDeleted: true },
      select: { id: true, name: true, websiteUrl: true, slug: true },
    });
    const existingNameSet = new Set(existingProjects.map((item) => normalizeKey(item.name)));
    const existingWebsiteSet = new Set(existingProjects.map((item) => normalizeKey(item.websiteUrl)));

    for (const row of previewRows) {
      if (!row.valid) {
        failed += 1;
        failureReasons.push({ rowNumber: row.rowNumber, name: row.name || `第 ${row.rowNumber} 行`, reason: row.errors.join("；") });
        continue;
      }

      if (row.duplicate || !row.canImport || !row.normalized) {
        skipped += 1;
        continue;
      }

      const normalized = row.normalized;
      const nameKey = normalizeKey(normalized.name);
      const websiteKey = normalizeKey(normalized.websiteUrl);
      if (existingNameSet.has(nameKey) || existingWebsiteSet.has(websiteKey)) {
        skipped += 1;
        continue;
      }

      try {
        const deletedMatch = deletedProjects.find((project) => (
          normalizeKey(project.name) === nameKey
          || normalizeKey(project.websiteUrl) === websiteKey
          || normalizeKey(project.slug) === normalizeKey(normalized.slug)
        ));

        if (deletedMatch) {
          await service.updateProject(deletedMatch.id, mapProjectFormToCreateInput(toProjectFormInput(normalized)));
          await service.restore(deletedMatch.id);
        } else {
          await service.createProject(mapProjectFormToCreateInput(toProjectFormInput(normalized)));
        }

        success += 1;
        existingNameSet.add(nameKey);
        existingWebsiteSet.add(websiteKey);
      } catch (error) {
        failed += 1;
        failureReasons.push({
          rowNumber: row.rowNumber,
          name: row.name || `第 ${row.rowNumber} 行`,
          reason: error instanceof Error ? error.message : "数据库写入失败",
        });
      }
    }

    const result = summarizeImportResult(
      previewRows,
      failureReasons,
    );

    return NextResponse.json({
      ok: true,
      result: {
        success,
        skipped,
        failed,
        failureReasons: result.failureReasons,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "数据库写入失败" },
      { status: 400 },
    );
  }
}
