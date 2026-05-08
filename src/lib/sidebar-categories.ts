import { CATEGORIES, CATEGORY_LABELS_ZH, type Category } from "./project-taxonomy";
import { categoryToSlug } from "./category-slugs";

const RECOMMENDED_ORDER: Category[] = [...CATEGORIES];

export type SidebarCategoryItem = {
  category: Category;
  slug: string;
  label: string;
  count: number;
};

export function buildSidebarCategories(categoryCounts: Record<string, number>): SidebarCategoryItem[] {
  const order = new Map<string, number>(RECOMMENDED_ORDER.map((category, index) => [category, index]));

  return CATEGORIES
    .map((category) => ({
      category,
      slug: categoryToSlug(category),
      label: CATEGORY_LABELS_ZH[category],
      count: categoryCounts[category] ?? 0,
    }))
    .sort((a, b) => (order.get(a.category) ?? 999) - (order.get(b.category) ?? 999));
}
