import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { canWriteAdminData } from "@/lib/admin-write-guard";

export async function requireAdminWriteAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!canWriteAdminData(session)) {
    return NextResponse.json({ message: "未登录或会话已失效" }, { status: 401 });
  }

  return null;
}
