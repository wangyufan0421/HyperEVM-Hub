import {
  PROJECT_STATUS,
  normalizeCategoriesInput,
  mapLegacyCategoryToV2,
} from "./project-taxonomy";
import { generateProjectSlug, normalizeManualSlug } from "./project-rules";

export const IMPORT_HEADERS = [
  "name",
  "slug",
  "categories",
  "category",
  "status",
  "shortDescription",
  "websiteUrl",
  "logoUrl",
  "twitterUrl",
  "discordUrl",
  "docsUrl",
  "longDescription",
  "coreFeatures",
  "targetUsers",
  "riskNotes",
  "tags",
  "isFeatured",
  "featuredOrder",
] as const;

export type ImportField = (typeof IMPORT_HEADERS)[number];

export type ImportRawRow = Partial<Record<ImportField, unknown>>;

export type ImportNormalizedRow = {
  name: string;
  slug: string;
  category: string;
  categories: string[];
  invalidCategories: string[];
  status: string;
  shortDescription: string;
  websiteUrl: string;
  logoUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  docsUrl: string | null;
  longDescription: string | null;
  coreFeatures: string[];
  targetUsers: string[];
  riskNotes: string[];
  tags: string[];
  isFeatured: boolean;
  featuredOrder: number | null;
};

export type PreviewRow = {
  rowNumber: number;
  name: string;
  category: string;
  status: string;
  websiteUrl: string;
  slug: string;
  valid: boolean;
  canImport: boolean;
  duplicate: boolean;
  duplicateReason: string | null;
  errors: string[];
  normalized: ImportNormalizedRow | null;
};

export type PreviewResult = {
  rows: PreviewRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    importable: number;
  };
};

export type ImportResult = {
  success: number;
  skipped: number;
  failed: number;
  failureReasons: Array<{ rowNumber: number; name: string; reason: string }>;
};

const STATUS_SET = new Set(PROJECT_STATUS);

export function parseImportContent(params: {
  content: string;
  format: "csv" | "json";
}): ImportRawRow[] {
  const text = params.content.trim();
  if (!text) {
    throw new Error("文件为空");
  }

  if (params.format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("文件格式不正确");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("JSON 不是数组");
    }

    return parsed.map((item) => (typeof item === "object" && item ? item : {})) as ImportRawRow[];
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("文件为空");
  }

  const headerCells = splitCsvLine(lines[0]);
  const missingHeaders = ["name", "shortDescription", "websiteUrl"].filter((key) => !headerCells.includes(key));
  if (missingHeaders.length > 0) {
    throw new Error("CSV 缺少表头");
  }
  if (!headerCells.includes("categories") && !headerCells.includes("category")) {
    throw new Error("CSV 缺少分类字段（categories 或 category）");
  }

  const rows: ImportRawRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const row: ImportRawRow = {};
    headerCells.forEach((header, index) => {
      if (IMPORT_HEADERS.includes(header as ImportField)) {
        row[header as ImportField] = values[index] ?? "";
      }
    });
    if (isInstructionRow(row)) {
      continue;
    }
    rows.push(row);
  }

  return rows;
}

export function buildImportPreview(params: {
  rows: ImportRawRow[];
  existingProjects: Array<{ name: string; websiteUrl: string; slug: string; isDeleted?: boolean }>;
}): PreviewResult {
  const activeProjects = params.existingProjects.filter((item) => !item.isDeleted);
  const existingNameSet = new Set(activeProjects.map((item) => item.name.trim().toLowerCase()));
  const existingWebsiteSet = new Set(activeProjects.map((item) => normalizeUrlForCompare(item.websiteUrl)));
  const existingSlugSet = new Set(activeProjects.map((item) => item.slug));

  const incomingNameSet = new Set<string>();
  const incomingWebsiteSet = new Set<string>();
  const resolvedSlugSet = new Set(existingSlugSet);

  const rows = params.rows.map((raw, idx) => {
    const rowNumber = idx + 2;
    const normalized = normalizeImportRow(raw);
    const errors = validateNormalizedRow(normalized);

    let duplicateReason: string | null = null;
    const lowerName = normalized.name.toLowerCase();
    const normalizedWebsite = normalizeUrlForCompare(normalized.websiteUrl);

    if (!errors.length) {
      if (existingNameSet.has(lowerName) || incomingNameSet.has(lowerName)) {
        duplicateReason = "项目名重复，将跳过";
      } else if (existingWebsiteSet.has(normalizedWebsite) || incomingWebsiteSet.has(normalizedWebsite)) {
        duplicateReason = "官网重复，将跳过";
      }
    }

    let rowNormalized: ImportNormalizedRow | null = null;
    if (!errors.length) {
      const resolvedSlug = resolveUniqueSlug(normalized.slug, resolvedSlugSet);
      rowNormalized = { ...normalized, slug: resolvedSlug };
      incomingNameSet.add(lowerName);
      incomingWebsiteSet.add(normalizedWebsite);
      resolvedSlugSet.add(resolvedSlug);
    }

    const valid = errors.length === 0;
    const duplicate = Boolean(duplicateReason);

    return {
      rowNumber,
      name: normalized.name,
      category: normalized.category,
      status: normalized.status,
      websiteUrl: normalized.websiteUrl,
      slug: rowNormalized?.slug ?? normalized.slug,
      valid,
      canImport: valid && !duplicate,
      duplicate,
      duplicateReason,
      errors,
      normalized: rowNormalized,
    } satisfies PreviewRow;
  });

  return {
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((row) => row.valid).length,
      invalid: rows.filter((row) => !row.valid).length,
      duplicates: rows.filter((row) => row.duplicate).length,
      importable: rows.filter((row) => row.canImport).length,
    },
  };
}

export function summarizeImportResult(rows: PreviewRow[], failures: Array<{ rowNumber: number; name: string; reason: string }>): ImportResult {
  const success = rows.filter((row) => row.canImport).length - failures.length;
  const skipped = rows.filter((row) => row.duplicate).length;
  const failed = rows.filter((row) => !row.valid).length + failures.length;

  return {
    success,
    skipped,
    failed,
    failureReasons: [
      ...rows
        .filter((row) => !row.valid)
        .map((row) => ({ rowNumber: row.rowNumber, name: row.name || `第 ${row.rowNumber} 行`, reason: row.errors.join("；") })),
      ...failures,
    ],
  };
}

function normalizeImportRow(row: ImportRawRow): ImportNormalizedRow {
  const name = asString(row.name).trim();
  const slug = normalizeManualSlug(asString(row.slug).trim() || generateProjectSlug(name));
  const categoriesRaw = normalizeListField(row.categories);
  const categoryRaw = asString(row.category).trim();
  const categoryCandidates = categoriesRaw.length > 0 ? categoriesRaw : categoryRaw ? [categoryRaw] : [];
  const invalidCategories = categoryCandidates.filter((value) => !mapLegacyCategoryToV2(value));
  const categories = normalizeCategoriesInput(categoryCandidates);
  const category = categories[0] ?? mapLegacyCategoryToV2(categoryRaw) ?? categoryRaw;
  const statusInput = asString(row.status).trim();
  const status = statusInput || "Live";
  const shortDescription = asString(row.shortDescription).trim();
  const websiteUrl = normalizeExternalUrl(asString(row.websiteUrl));

  return {
    name,
    slug,
    category,
    categories,
    invalidCategories,
    status,
    shortDescription,
    websiteUrl,
    logoUrl: optionalExternalUrl(row.logoUrl),
    twitterUrl: optionalExternalUrl(row.twitterUrl),
    discordUrl: optionalExternalUrl(row.discordUrl),
    docsUrl: optionalExternalUrl(row.docsUrl),
    longDescription: optionalString(row.longDescription),
    coreFeatures: normalizeListField(row.coreFeatures),
    targetUsers: normalizeListField(row.targetUsers),
    riskNotes: normalizeListField(row.riskNotes),
    tags: normalizeListField(row.tags),
    isFeatured: normalizeBoolean(row.isFeatured),
    featuredOrder: normalizeNumber(row.featuredOrder),
  };
}

function validateNormalizedRow(row: ImportNormalizedRow): string[] {
  const errors: string[] = [];

  if (!row.name) errors.push("缺少必填字段：name 项目名");
  if (!row.categories.length) errors.push("缺少必填字段：categories 分类（至少一个）");
  if (row.invalidCategories.length > 0) errors.push(`分类不合法：${row.invalidCategories.join("、")}`);
  if (!row.shortDescription) errors.push("缺少必填字段：shortDescription 一句话简介");
  if (!row.websiteUrl) errors.push("官网链接缺失");
  if (!row.slug) errors.push("slug 生成失败");

  if (row.status && !STATUS_SET.has(row.status as (typeof PROJECT_STATUS)[number])) {
    errors.push("状态不存在");
  }

  return errors;
}

function resolveUniqueSlug(baseSlug: string, taken: Set<string>): string {
  if (!taken.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (true) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
    suffix += 1;
  }
}

function normalizeListField(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => asString(item).trim()).filter(Boolean);
  }

  const value = asString(input).trim();
  if (!value) return [];

  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBoolean(value: unknown): boolean {
  const text = asString(value).trim().toLowerCase();
  return ["true", "1", "yes", "y", "on", "是"].includes(text);
}

function normalizeNumber(value: unknown): number | null {
  const text = asString(value).trim();
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function optionalExternalUrl(value: unknown): string | null {
  const text = asString(value).trim();
  if (!text) return null;
  return normalizeExternalUrl(text);
}

function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function optionalString(value: unknown): string | null {
  const text = asString(value).trim();
  return text || null;
}

function normalizeUrlForCompare(url: string): string {
  return normalizeExternalUrl(url).toLowerCase();
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function isInstructionRow(row: ImportRawRow): boolean {
  const name = asString(row.name).trim();
  const category = asString(row.category).trim();
  const categories = asString(row.categories).trim();
  const status = asString(row.status).trim();
  const websiteUrl = asString(row.websiteUrl).trim();

  if (name === "项目名称") {
    return true;
  }

  const instructionHints = [name, category, categories, status, websiteUrl].join(" ");
  return ["项目分类", "项目状态", "官网链接"].some((keyword) => instructionHints.includes(keyword));
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}
