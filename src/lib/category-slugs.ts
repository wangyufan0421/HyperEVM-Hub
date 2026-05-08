import {
  CATEGORIES,
  CATEGORY_LABELS_ZH,
  mapCategoryToV2OrInfra,
  type Category,
} from "./project-taxonomy";

const CATEGORY_SLUG_MAP = new Map<Category, string>([
  ["DeFi", "defi"],
  ["DEX", "dex"],
  ["Bridge", "bridge"],
  ["NFT", "nft"],
  ["Wallet", "wallet"],
  ["Infra", "infra"],
  ["Stable", "stable"],
  ["HIP-3", "hip-3"],
  ["HIP-4", "hip-4"],
]);

const SLUG_CATEGORY_MAP = new Map<string, Category>(
  [...CATEGORY_SLUG_MAP.entries()].map(([category, slug]) => [slug, category]),
);

export function categoryToSlug(category: string): string {
  const mapped = mapCategoryToV2OrInfra(category);
  return CATEGORY_SLUG_MAP.get(mapped) ?? "infra";
}

export function slugToCategory(slug: string): Category | null {
  return SLUG_CATEGORY_MAP.get(slug) ?? null;
}

export function getCategorySlugEntries(): Array<{ category: Category; slug: string }> {
  return CATEGORIES.map((category) => ({ category, slug: categoryToSlug(category) }));
}

export function getCategorySlugByCategory(category: string): string {
  return categoryToSlug(category);
}

export function getCategoryDisplayName(category: string): string {
  const mapped = mapCategoryToV2OrInfra(category);
  return CATEGORY_LABELS_ZH[mapped];
}
