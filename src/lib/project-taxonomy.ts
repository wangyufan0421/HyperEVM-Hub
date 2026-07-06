export const CATEGORIES = [
  "DeFi",
  "DEX",
  "Bridge",
  "NFT",
  "Wallet",
  "Infra",
  "Stable",
  "HIP-3",
  "HIP-4",
] as const;

export const CATEGORY_TABS = ["All", ...CATEGORIES] as const;

export const LEGACY_CATEGORY_MAP = {
  Dexs: "DEX",
  "DEX Aggregator": "DEX",
  Lending: "DeFi",
  Yield: "DeFi",
  "Yield Aggregator": "DeFi",
  "Liquid Staking": "DeFi",
  "Liquidity Manager": "DeFi",
  "Onchain Capital Allocator": "DeFi",
  "Risk Curators": "DeFi",
  "Basis Trading": "DeFi",
  "Leveraged Farming": "DeFi",
  Options: "DeFi",
  Derivatives: "DeFi",
  Indexes: "DeFi",
  "Prediction Market": "DeFi",
  SoFi: "DeFi",
  CDP: "Stable",
  RWA: "Stable",
  Synthetics: "Stable",
  "Reserve Currency": "Stable",
  "Cross Chain Bridge": "Bridge",
  Bridge: "Bridge",
  "NFT Automated Strategies": "NFT",
  Gaming: "NFT",
  CEX: "Infra",
  "AI Agents": "Infra",
  Launchpad: "Infra",
  Payments: "Infra",
} as const;

export const PROJECT_STATUS = ["Live", "Beta", "Testnet", "Coming Soon", "Inactive"] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryTab = (typeof CATEGORY_TABS)[number];
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const STATUS_LABELS_ZH: Record<ProjectStatus, string> = {
  Live: "运行中",
  Beta: "Beta",
  Testnet: "测试网",
  "Coming Soon": "即将上线",
  Inactive: "已停用",
};

export const CATEGORY_LABELS_ZH: Record<Category, string> = {
  DeFi: "DeFi",
  DEX: "DEX",
  Bridge: "Bridge",
  NFT: "NFT",
  Wallet: "Wallet",
  Infra: "Infra",
  Stable: "Stable",
  "HIP-3": "HIP-3",
  "HIP-4": "HIP-4",
};

const CATEGORY_SET = new Set<string>(CATEGORIES);

export function isV2Category(category: string): category is Category {
  return CATEGORY_SET.has(category);
}

export function mapLegacyCategoryToV2(category: string): Category | null {
  const normalized = category.trim();
  if (isV2Category(normalized)) return normalized;
  return (LEGACY_CATEGORY_MAP as Record<string, Category | undefined>)[normalized] ?? null;
}

export function mapCategoryToV2OrInfra(category: string): Category {
  return mapLegacyCategoryToV2(category) ?? "Infra";
}

export function normalizeCategoriesInput(values: string[]): Category[] {
  const seen = new Set<Category>();
  for (const value of values) {
    const mapped = mapLegacyCategoryToV2(value);
    if (mapped) seen.add(mapped);
  }
  return [...seen];
}

export type ProjectFilterInput = {
  name: string;
  categories: Category[];
  status: ProjectStatus;
};

export function filterProjects(
  projects: ProjectFilterInput[],
  filters: {
    category: Category | "all";
    status: ProjectStatus | "all";
    query: string;
  },
): ProjectFilterInput[] {
  const q = filters.query.trim().toLowerCase();

  return projects.filter((project) => {
    const categoryMatch = filters.category === "all" || project.categories.includes(filters.category);
    const statusMatch = filters.status === "all" || project.status === filters.status;
    const queryMatch = q.length === 0 || project.name.toLowerCase().includes(q);
    return categoryMatch && statusMatch && queryMatch;
  });
}
