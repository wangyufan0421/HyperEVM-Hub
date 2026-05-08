import type { PrismaClient } from "@prisma/client";
import { isV2Category, mapCategoryToV2OrInfra, normalizeCategoriesInput, type Category } from "./project-taxonomy";
import { generateProjectSlug, normalizeManualSlug } from "./project-rules";

const DUPLICATE_SLUG_ERROR = "slug 已存在，请修改项目名或手动填写一个新的 slug。";
const INVALID_CATEGORY_ERROR = "项目分类至少选择一个，且必须是新分类。";

type ErrorCode = "DUPLICATE_SLUG" | "INVALID_CATEGORY";

export class AdminProjectError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode = "DUPLICATE_SLUG") {
    super(message);
    this.name = "AdminProjectError";
    this.code = code;
  }
}

type ProjectRepo = Pick<PrismaClient, "project">;

type ProjectWithSlug = { id: string; slug: string };

export type ProjectFormInput = {
  name: string;
  slug: string;
  autoResolveSlug?: boolean;
  category?: string;
  categories?: string;
  status: string;
  shortDescription: string;
  websiteUrl: string;
  logoFile?: string;
  logoUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  docsUrl?: string;
  longDescription?: string;
  coreFeatures?: string;
  targetUsers?: string;
  riskNotes?: string;
  isFeatured?: boolean;
  featuredOrder?: string;
};

export function serializeProjectList(value: string[]): string {
  return JSON.stringify(value);
}

export function parseProjectList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return value
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parseCategoriesFromInput(input: ProjectFormInput): Category[] {
  const raw = input.categories ?? input.category ?? "";
  const candidates = raw
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const normalized = normalizeCategoriesInput(candidates);
  if (normalized.length === 0) {
    throw new AdminProjectError(INVALID_CATEGORY_ERROR, "INVALID_CATEGORY");
  }

  if (input.category?.trim() && !isV2Category(input.category.trim()) && !input.categories?.trim()) {
    return [mapCategoryToV2OrInfra(input.category.trim())];
  }

  return normalized;
}

function toPrimaryCategory(categories: Category[], fallback: string | undefined): Category {
  if (categories.length > 0) return categories[0];
  if (fallback && isV2Category(fallback)) return fallback;
  return "Infra";
}

export function mapProjectFormToCreateInput(input: ProjectFormInput) {
  const slug = normalizeManualSlug(input.slug.trim() || generateProjectSlug(input.name));
  const categories = parseCategoriesFromInput(input);
  const category = toPrimaryCategory(categories, input.category);

  return {
    name: input.name.trim(),
    slug,
    category,
    categories,
    status: input.status.trim(),
    shortDescription: input.shortDescription.trim(),
    websiteUrl: normalizeExternalUrl(input.websiteUrl) ?? "",
    logoFile: input.logoFile?.trim() || null,
    logoUrl: normalizeExternalUrl(input.logoUrl),
    twitterUrl: normalizeExternalUrl(input.twitterUrl),
    discordUrl: normalizeExternalUrl(input.discordUrl),
    docsUrl: normalizeExternalUrl(input.docsUrl),
    longDescription: input.longDescription?.trim() || null,
    coreFeatures: splitList(input.coreFeatures),
    targetUsers: splitList(input.targetUsers),
    riskNotes: splitList(input.riskNotes),
    tags: [],
    isFeatured: Boolean(input.isFeatured),
    featuredOrder: input.featuredOrder?.trim() ? Number(input.featuredOrder) : null,
    autoResolveSlug: Boolean(input.autoResolveSlug),
  };
}

export function mapProjectFormToUpdateInput(input: ProjectFormInput) {
  return mapProjectFormToCreateInput(input);
}

function serializeProjectData(data: ReturnType<typeof mapProjectFormToCreateInput>) {
  const safeFeaturedOrder = Number.isFinite(data.featuredOrder) ? data.featuredOrder : null;

  return {
    name: data.name,
    slug: data.slug,
    category: data.category,
    categories: serializeProjectList(data.categories),
    status: data.status,
    shortDescription: data.shortDescription,
    websiteUrl: data.websiteUrl,
    logoFile: data.logoFile,
    logoUrl: data.logoUrl,
    twitterUrl: data.twitterUrl,
    discordUrl: data.discordUrl,
    docsUrl: data.docsUrl,
    longDescription: data.longDescription,
    coreFeatures: serializeProjectList(data.coreFeatures),
    targetUsers: serializeProjectList(data.targetUsers),
    riskNotes: serializeProjectList(data.riskNotes),
    tags: serializeProjectList([]),
    isFeatured: data.isFeatured,
    featuredOrder: safeFeaturedOrder,
  };
}

export function normalizeProjectRecord<T extends Record<string, unknown>>(project: T): T;
export function normalizeProjectRecord(project: null): null;
export function normalizeProjectRecord<T extends Record<string, unknown>>(project: T | null): T | null;
export function normalizeProjectRecord<T extends Record<string, unknown>>(project: T | null): T | null {
  if (!project) return null;

  const categoriesRaw = parseProjectList(project.categories);
  const categories = normalizeCategoriesInput(categoriesRaw);
  const fallbackCategory = typeof project.category === "string" && project.category.trim()
    ? mapCategoryToV2OrInfra(project.category)
    : "Infra";

  const normalizedCategories = categories.length > 0 ? categories : [fallbackCategory];

  return {
    ...project,
    category: normalizedCategories[0],
    categories: normalizedCategories,
    coreFeatures: parseProjectList(project.coreFeatures),
    targetUsers: parseProjectList(project.targetUsers),
    riskNotes: parseProjectList(project.riskNotes),
    tags: [],
  };
}

function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function createProjectService(repo: ProjectRepo) {
  async function findBySlug(slug: string) {
    return repo.project.findUnique({ where: { slug } }) as Promise<ProjectWithSlug | null>;
  }

  async function resolveUniqueSlug(baseSlug: string) {
    const base = normalizeManualSlug(baseSlug);
    if (!base) return "";

    const exact = await findBySlug(base);
    if (!exact) return base;

    let suffix = 2;
    while (true) {
      const candidate = `${base}-${suffix}`;
      const exists = await findBySlug(candidate);
      if (!exists) return candidate;
      suffix += 1;
    }
  }

  return {
    async listProjects(showDeleted: boolean) {
      const projects = await repo.project.findMany({
        where: { isDeleted: showDeleted },
        orderBy: [{ updatedAt: "desc" }],
      });

      return projects.map((project) => normalizeProjectRecord(project));
    },

    async getProjectById(id: string) {
      return normalizeProjectRecord(await repo.project.findUnique({ where: { id } }));
    },

    async createProject(data: ReturnType<typeof mapProjectFormToCreateInput>) {
      const baseSlug = data.slug.trim() || generateProjectSlug(data.name);
      const normalizedBaseSlug = normalizeManualSlug(baseSlug);
      if (!normalizedBaseSlug) {
        throw new AdminProjectError(DUPLICATE_SLUG_ERROR);
      }

      const existing = await findBySlug(normalizedBaseSlug);
      if (existing && !data.autoResolveSlug) {
        throw new AdminProjectError(DUPLICATE_SLUG_ERROR);
      }

      const resolvedSlug = existing
        ? await resolveUniqueSlug(normalizedBaseSlug)
        : normalizedBaseSlug;

      return normalizeProjectRecord(await repo.project.create({
        data: serializeProjectData({ ...data, slug: resolvedSlug }),
      }));
    },

    async updateProject(id: string, data: ReturnType<typeof mapProjectFormToUpdateInput>) {
      const existing = await findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new AdminProjectError(DUPLICATE_SLUG_ERROR);
      }

      return normalizeProjectRecord(await repo.project.update({ where: { id }, data: serializeProjectData(data) }));
    },

    async softDelete(id: string) {
      return repo.project.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    },

    async restore(id: string) {
      return repo.project.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null },
      });
    },
  };
}
