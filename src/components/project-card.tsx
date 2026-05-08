import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS_ZH } from "@/lib/project-taxonomy";
import { resolveProjectLogo } from "@/lib/project-rules";
import type { DirectoryProject } from "@/lib/project-directory";

export function ProjectCard({ project }: { project: DirectoryProject }) {
  return (
    <li className="group relative min-h-[184px] overflow-hidden rounded-[22px] border border-[#0639341f] bg-[radial-gradient(circle_at_86%_8%,rgba(255,230,109,0.36),transparent_7rem),linear-gradient(145deg,rgba(255,255,255,0.92),rgba(227,255,249,0.84))] p-[18px] shadow-[0_14px_34px_rgba(0,108,116,0.08)] transition duration-200 hover:-translate-y-1 hover:cursor-pointer hover:border-[#09b99c94] hover:shadow-[0_20px_46px_rgba(0,108,116,0.16),0_0_0_4px_rgba(142,245,220,0.16)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(circle_at_24%_14%,rgba(142,245,220,0.44),transparent_9rem),linear-gradient(135deg,rgba(255,255,255,0.18),rgba(142,245,220,0.18))]" />
      </div>

      <Link className="relative z-10 block space-y-4" href={`/projects/${project.slug}`}>
        <div className="flex items-center gap-3">
          <Image
            alt={`${project.name} logo`}
            className="h-[46px] w-[46px] rounded-[15px] border border-[#0639341f] bg-[#06342f] object-cover transition duration-200 group-hover:scale-[1.04] group-hover:shadow-[0_10px_24px_rgba(9,185,156,0.24)]"
            height={46}
            src={resolveProjectLogo({ logoFile: project.logoFile, logoUrl: project.logoUrl })}
            width={46}
          />
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-black leading-tight text-[#072b28]">{project.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-black text-[#62807b]">
              {project.categories.map((category) => (
                <span key={category}>
                  {CATEGORY_LABELS_ZH[category as keyof typeof CATEGORY_LABELS_ZH] ?? category}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="line-clamp-3 text-[14px] font-bold leading-6 text-[#31534f]">{project.shortDescription}</p>
      </Link>
    </li>
  );
}
