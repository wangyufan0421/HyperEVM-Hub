export function canWriteAdminData(cookieSessionValue: string | undefined): boolean {
  const token = process.env.ADMIN_SESSION_TOKEN;
  if (!token || !cookieSessionValue) {
    return false;
  }

  return token === cookieSessionValue;
}
