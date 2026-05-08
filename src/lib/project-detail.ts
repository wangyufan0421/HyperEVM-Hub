import { resolveProjectLogo } from "./project-rules";
import type { DirectoryProject } from "./project-directory";

export type DetailSection = {
  key: "description" | "core-features";
  title: string;
  content: string[];
};

export function buildProjectDetailOverview(project: Pick<DirectoryProject, "shortDescription"> & {
  longDescription: string | null;
}): string {
  return project.longDescription?.trim() || project.shortDescription.trim();
}

export function buildProjectDetailSections(project: DirectoryProject & {
  longDescription: string | null;
  coreFeatures: string[];
  targetUsers: string[];
  riskNotes: string[];
}): DetailSection[] {
  const sections: DetailSection[] = [];

  if (project.longDescription?.trim()) {
    sections.push({ key: "description", title: "项目简介卡", content: [project.longDescription.trim()] });
  }

  if (project.coreFeatures.length > 0) {
    sections.push({ key: "core-features", title: "核心功能卡", content: project.coreFeatures });
  }

  return sections;
}

export function getVisibleProjectLinks(project: DirectoryProject): Array<{ label: string; href: string }> {
  return [
    ...(project.websiteUrl?.trim() ? [{ label: "官网", href: project.websiteUrl.trim() }] : []),
    ...(project.twitterUrl?.trim() ? [{ label: "Twitter / X", href: project.twitterUrl.trim() }] : []),
    ...(project.discordUrl?.trim() ? [{ label: "Discord", href: project.discordUrl.trim() }] : []),
    ...(project.docsUrl?.trim() ? [{ label: "Docs", href: project.docsUrl.trim() }] : []),
  ];
}

export function getProjectLogoSrc(project: Pick<DirectoryProject, "logoFile" | "logoUrl">): string {
  return resolveProjectLogo({ logoFile: project.logoFile, logoUrl: project.logoUrl });
}
