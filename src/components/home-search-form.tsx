"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type KeyboardEvent } from "react";

export function HomeSearchForm() {
  const router = useRouter();

  function submitSearch(form: HTMLFormElement) {
    const formData = new FormData(form);
    const query = String(formData.get("query") ?? "").trim();
    if (!query) {
      router.push("/projects");
      return;
    }

    router.push(`/search?query=${encodeURIComponent(query)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch(event.currentTarget);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    submitSearch(event.currentTarget.form as HTMLFormElement);
  }

  return (
    <form
      action="/search"
      className="command-search mx-auto flex h-12 w-full max-w-[650px] items-center gap-3 px-4"
      method="get"
      onSubmit={handleSubmit}
    >
      <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-[color:var(--text-dim)]" fill="none" viewBox="0 0 20 20">
        <path
          d="m14.2 14.2 3.3 3.3M8.8 15.1a6.3 6.3 0 1 1 0-12.6 6.3 6.3 0 0 1 0 12.6Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
      <input
        className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-dim)]"
        name="query"
        onKeyDown={handleKeyDown}
        placeholder="Search HyperEVM — projects, dashboards, protocols..."
        type="search"
      />
      <span className="hidden items-center gap-1 sm:flex">
        <kbd className="rounded-[5px] border border-[color:var(--line)] bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--text-dim)]">
          Ctrl
        </kbd>
        <kbd className="rounded-[5px] border border-[color:var(--line)] bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--text-dim)]">
          K
        </kbd>
      </span>
    </form>
  );
}
