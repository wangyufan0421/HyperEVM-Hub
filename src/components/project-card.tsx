import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS_ZH } from "@/lib/project-taxonomy";
import { resolveProjectLogo } from "@/lib/project-rules";
import type { DirectoryProject } from "@/lib/project-directory";

export function ProjectCard({ project }: { project: DirectoryProject }) {
  return (
    <li className="group ui-card-quiet min-h-[124px] overflow-hidden p-4 transition hover:border-[color:var(--line-mint)] hover:bg-white/82">
      <Link className="flex h-full gap-3" href={`/projects/${project.slug}`}>
        <Image
          alt={`${project.name} logo`}
          className="h-10 w-10 shrink-0 rounded-[9px] border border-[color:var(--line)] bg-[#062d29] object-cover"
          height={40}
          src={resolveProjectLogo({ logoFile: project.logoFile, logoUrl: project.logoUrl })}
          width={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold leading-tight text-[color:var(--text)] group-hover:text-[color:var(--mint)]">
                {project.name}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[color:var(--text-dim)]">
                {project.categories.map((category) => (
                  <span key={category}>{CATEGORY_LABELS_ZH[category as keyof typeof CATEGORY_LABELS_ZH] ?? category}</span>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[color:var(--text-dim)]">View</span>
          </div>
          <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-5 text-[color:var(--text-mute)]">
            {project.shortDescription}
          </p>
        </div>
      </Link>
    </li>
  );
}
