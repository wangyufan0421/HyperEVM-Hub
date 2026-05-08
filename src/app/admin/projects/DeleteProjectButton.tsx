"use client";

export function DeleteProjectButton() {
  return (
    <button
      onClick={(event) => {
        const confirmed = window.confirm("确认删除该项目吗？删除后前台不再展示，后台可在已删除项目中恢复。");
        if (!confirmed) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      删除
    </button>
  );
}
