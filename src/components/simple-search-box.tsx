export function SimpleSearchBox(props: {
  action: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  maxWidthClassName?: string;
}) {
  return (
    <form action={props.action} className={props.maxWidthClassName ?? "max-w-[360px]"} method="get">
      <input
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
        defaultValue={props.defaultValue ?? ""}
        name={props.name ?? "query"}
        placeholder={props.placeholder ?? "搜索项目名称"}
      />
    </form>
  );
}
