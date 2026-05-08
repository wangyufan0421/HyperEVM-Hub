import { PROJECT_STATUS, mapLegacyCategoryToV2, isV2Category } from "./project-taxonomy";
import { generateProjectSlug } from "./project-rules";

export type ImportRow = {
  name?: string;
  slug?: string;
  category?: string;
  status?: string;
  shortDescription?: string;
  websiteUrl?: string;
  logoUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  docsUrl?: string;
  longDescription?: string;
  coreFeatures?: string;
  targetUsers?: string;
  riskNotes?: string;
  tags?: string;
};

const ALLOWED_STATUS = new Set(PROJECT_STATUS);

export function validateImportRow(row: ImportRow): {
  valid: boolean;
  errors: string[];
  normalized: Required<Pick<ImportRow, "name" | "slug" | "category" | "status" | "shortDescription" | "websiteUrl">>;
} {
  const errors: string[] = [];
  const name = (row.name ?? "").trim();
  const inputCategory = (row.category ?? "").trim();
  const mappedCategory = mapLegacyCategoryToV2(inputCategory);
  const category = mappedCategory ?? inputCategory;
  const status = (row.status ?? "").trim();
  const shortDescription = (row.shortDescription ?? "").trim();
  const websiteUrl = (row.websiteUrl ?? "").trim();
  const slug = (row.slug ?? "").trim() || generateProjectSlug(name);

  if (!name) errors.push("项目名缺失");
  if (!category) errors.push("分类缺失");
  if (!status) errors.push("状态缺失");
  if (!shortDescription) errors.push("一句话简介缺失");
  if (!websiteUrl) errors.push("官网缺失");

  if (category && !isV2Category(category)) errors.push("分类不存在");
  if (status && !ALLOWED_STATUS.has(status as (typeof PROJECT_STATUS)[number])) errors.push("状态不存在");
  if (websiteUrl && !/^https?:\/\//.test(websiteUrl)) errors.push("URL 格式错误");

  return {
    valid: errors.length === 0,
    errors,
    normalized: { name, slug, category, status, shortDescription, websiteUrl },
  };
}

export function dedupeImportRows(
  rows: Array<{ name: string; websiteUrl: string }>,
  existing: Array<{ name: string; websiteUrl: string }>,
): {
  accepted: Array<{ name: string; websiteUrl: string }>;
  skipped: Array<{ name: string; websiteUrl: string }>;
} {
  const existingNames = new Set(existing.map((item) => item.name));
  const existingWebsites = new Set(existing.map((item) => item.websiteUrl));

  const accepted: Array<{ name: string; websiteUrl: string }> = [];
  const skipped: Array<{ name: string; websiteUrl: string }> = [];

  for (const row of rows) {
    if (existingNames.has(row.name) || existingWebsites.has(row.websiteUrl)) {
      skipped.push(row);
      continue;
    }

    accepted.push(row);
    existingNames.add(row.name);
    existingWebsites.add(row.websiteUrl);
  }

  return { accepted, skipped };
}

export async function parseImportFile(file: File): Promise<ImportRow[]> {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("文件为空");
  }

  if (file.name.endsWith(".json")) {
    const parsed = JSON.parse(text) as ImportRow[];
    return Array.isArray(parsed) ? parsed : [];
  }

  if (file.name.endsWith(".csv")) {
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((item) => item.trim());

    return lines.map((line) => {
      const values = line.split(",").map((item) => item.trim());
      const row: ImportRow = {};
      headers.forEach((header, index) => {
        row[header as keyof ImportRow] = values[index] ?? "";
      });
      return row;
    });
  }

  throw new Error("文件格式错误");
}

export function analyzeImportRows(result: {
  success: number;
  skipped: number;
  failed: number;
  duplicateRows: string[];
}) {
  return {
    ...result,
    total: result.success + result.skipped + result.failed,
  };
}
