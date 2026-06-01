"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function RefreshCountdown({ cacheExpiresAt }: { cacheExpiresAt: string }) {
  const router = useRouter();
  const hasRefreshedRef = useRef(false);
  const nextRefreshAt = useMemo(() => new Date(cacheExpiresAt).getTime(), [cacheExpiresAt]);
  const [remainingLabel, setRemainingLabel] = useState("--:--");

  useEffect(() => {
    hasRefreshedRef.current = false;

    function tick() {
      const remaining = nextRefreshAt - Date.now();
      setRemainingLabel(formatRemaining(remaining));

      if (remaining <= 0 && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        router.refresh();
      }
    }

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [nextRefreshAt, router]);

  return (
    <div className="rounded-full border border-[#0e3f3a1f] bg-white/78 px-4 py-2.5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <p className="text-[12px] font-black uppercase tracking-normal text-[#5d7872]">下次刷新</p>
      <p className="font-mono text-[18px] font-black leading-tight text-[#087b6d]">{remainingLabel}</p>
    </div>
  );
}
