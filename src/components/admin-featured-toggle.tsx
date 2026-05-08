"use client";

import { useState } from "react";

export function AdminFeaturedToggle(props: {
  projectId: string;
  checked: boolean;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState(props.checked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onToggle(next: boolean) {
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/projects/${props.projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isFeatured: next }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.message ?? "更新精选状态失败");
        return;
      }

      setChecked(next);
    } catch {
      setError("更新精选状态失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="inline-flex items-center gap-2 text-sm text-zinc-800">
        <input
          checked={checked}
          className="h-4 w-4"
          disabled={props.disabled || pending}
          onChange={(event) => void onToggle(event.target.checked)}
          type="checkbox"
        />
        <span>精选</span>
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
