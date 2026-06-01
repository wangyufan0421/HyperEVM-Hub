import { findBestProjectSearchMatch, type DirectoryProject } from "@/lib/project-directory";
import { listPublicProjects } from "@/lib/public-projects";
import { NextResponse, type NextRequest } from "next/server";

function toDirectoryProject(project: Awaited<ReturnType<typeof listPublicProjects>>[number]): DirectoryProject {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    category: project.category ?? project.categories[0] ?? "Infra",
    categories: project.categories,
    status: project.status,
    shortDescription: project.shortDescription,
    logoFile: project.logoFile,
    logoUrl: project.logoUrl,
    websiteUrl: project.websiteUrl,
    twitterUrl: project.twitterUrl,
    discordUrl: project.discordUrl,
    docsUrl: project.docsUrl,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const redirectUrl = request.nextUrl.clone();

  if (!query) {
    redirectUrl.pathname = "/projects";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const projects = (await listPublicProjects()).map(toDirectoryProject);
  const match = findBestProjectSearchMatch(projects, query);

  if (match) {
    redirectUrl.pathname = `/projects/${match.slug}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = "/projects";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("query", query);
  return NextResponse.redirect(redirectUrl);
}
