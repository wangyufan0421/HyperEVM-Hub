export type FrontendEmptyState = "no-projects" | "no-results" | "not-found";
export type AdminEmptyState =
  | "projects-empty"
  | "deleted-empty"
  | "import-empty"
  | "import-invalid";

export function getFrontendEmptyStateMessage(state: FrontendEmptyState): string {
  if (state === "no-projects") return "暂无项目，等待管理员添加。";
  if (state === "no-results") return "没有找到匹配结果，请清除筛选后重试。";
  return "项目不存在，返回项目列表继续浏览。";
}

export function getAdminEmptyStateMessage(state: AdminEmptyState): string {
  if (state === "projects-empty") return "后台项目列表为空，请先新增项目。";
  if (state === "deleted-empty") return "已删除项目为空，可返回项目列表继续管理。";
  if (state === "import-empty") return "导入文件为空，请重新上传文件。";
  return "导入校验失败，请修正字段后重新上传文件。";
}
