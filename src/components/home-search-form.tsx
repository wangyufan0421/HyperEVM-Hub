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
    <form action="/search" className="w-full max-w-[420px]" method="get" onSubmit={handleSubmit}>
      <input
        className="h-11 w-full rounded-full border border-[#06393424] bg-white/90 px-5 text-[14px] font-semibold text-[#072b28] shadow-[0_10px_24px_rgba(9,185,156,0.06)] outline-none transition focus:border-[#09b99c8c] focus:shadow-[0_0_0_4px_rgba(142,245,220,0.26)]"
        name="query"
        onKeyDown={handleKeyDown}
        placeholder="搜索项目名称，回车进入项目页"
        type="search"
      />
    </form>
  );
}
