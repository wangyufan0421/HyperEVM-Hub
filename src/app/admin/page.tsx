"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      window.location.href = "/admin/projects";
      return;
    }

    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message ?? "登录失败");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-10">
      <section className="w-full rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-bold text-zinc-900">管理员登录</h1>
        <p className="mt-2 text-sm text-zinc-600">后台只服务管理员，不开放项目方账号。</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            placeholder="输入管理员密码"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white" type="submit">
            登录
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
        <div className="mt-4">
          <Link className="text-sm text-blue-600 hover:underline" href="/">
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
