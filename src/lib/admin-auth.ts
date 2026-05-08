export const ADMIN_SESSION_COOKIE = "hyper_admin_session";

const PROTECTED_PREFIXES = [
  "/admin/projects",
  "/admin/import",
  "/admin/settings",
] as const;

export function isProtectedAdminPath(pathname: string): boolean {
  if (pathname === "/admin") {
    return false;
  }

  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }

  return input === expected;
}

export function buildDeleteConfirmationMessage(): string {
  return "删除后该项目前台不再展示，数据不会被永久删除，后台可恢复。";
}

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  const expected = process.env.ADMIN_SESSION_TOKEN;
  if (!expected || !cookieValue) {
    return false;
  }

  return cookieValue === expected;
}
