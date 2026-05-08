import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };

  if (!verifyAdminPassword(body.password ?? "")) {
    return NextResponse.json({ message: "密码错误" }, { status: 401 });
  }

  const token = process.env.ADMIN_SESSION_TOKEN;
  if (!token) {
    return NextResponse.json({ message: "服务端未配置会话令牌" }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
