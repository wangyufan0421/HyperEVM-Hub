export function SimpleSearchBox(props: {
  action: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  maxWidthClassName?: string;
}) {
  return (
    <form action={props.action} className={props.maxWidthClassName ?? "max-w-[360px]"} method="get">
      <div className="flex h-10 items-center gap-2 rounded-[9px] border border-[color:var(--line)] bg-white/72 px-3 transition focus-within:border-[color:var(--line-mint)]">
        <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-[color:var(--text-dim)]" fill="none" viewBox="0 0 20 20">
          <path d="m14.2 14.2 3.3 3.3M8.8 15.1a6.3 6.3 0 1 1 0-12.6 6.3 6.3 0 0 1 0 12.6Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
        <input
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-dim)]"
          defaultValue={props.defaultValue ?? ""}
          name={props.name ?? "query"}
          placeholder={props.placeholder ?? "搜索项目名称"}
        />
      </div>
    </form>
  );
}
