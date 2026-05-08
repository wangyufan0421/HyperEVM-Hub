export type SiteSettingsSeoInput = {
  siteName: string;
  siteDescription: string;
  seoTitle: string;
  seoDescription: string;
};

export function buildSiteSeo(input: SiteSettingsSeoInput) {
  const title = input.seoTitle.trim() || input.siteName.trim();
  const description = input.seoDescription.trim() || input.siteDescription.trim();

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
  };
}

export function buildProjectSeo(input: {
  name: string;
  category: string;
  shortDescription: string;
  logoUrl: string | null;
}) {
  const title = `${input.name} | ${input.category} | HyperEVM Hub`;
  const description = input.shortDescription;
  const ogImage = input.logoUrl && input.logoUrl.trim() ? input.logoUrl : "/images/seo-default-og.png";

  return { title, description, ogTitle: title, ogDescription: description, ogImage };
}
