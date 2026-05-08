"use client";

export function BackButton() {
  function handleClick() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/projects";
  }

  return (
    <button
      className="inline-flex self-start cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-700 transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950"
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true">←</span>
      <span>返回</span>
    </button>
  );
}
