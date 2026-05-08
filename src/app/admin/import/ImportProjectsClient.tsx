"use client";

import { useMemo, useState } from "react";
import type { PreviewRow } from "@/lib/import-projects";

type PreviewPayload = {
  rows: PreviewRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    importable: number;
  };
};

type ImportResultPayload = {
  success: number;
  skipped: number;
  failed: number;
  failureReasons: Array<{ rowNumber: number; name: string; reason: string }>;
};

export function ImportProjectsClient() {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [textInput, setTextInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [importResult, setImportResult] = useState<ImportResultPayload | null>(null);

  const importableRows = useMemo(
    () => preview?.rows.filter((row) => row.canImport) ?? [],
    [preview],
  );

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>, nextFormat: "csv" | "json") {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormat(nextFormat);
    setFileName(file.name);
    setError("");
    setImportResult(null);

    const content = await file.text();
    setTextInput(content);
  }

  async function parsePreview() {
    setLoading(true);
    setError("");
    setImportResult(null);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "preview", format, content: textInput }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setPreview(null);
        setError(data.message ?? "解析失败");
        return;
      }

      setPreview(data.preview as PreviewPayload);
    } catch {
      setPreview(null);
      setError("解析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!preview) return;

    setLoading(true);
    setError("");
    setImportResult(null);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "confirm", rows: preview.rows }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.message ?? "导入失败");
        return;
      }

      setImportResult(data.result as ImportResultPayload);
    } catch {
      setError("导入失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">上传与输入</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-zinc-700">
            <span className="font-medium">上传 CSV 文件</span>
            <input accept=".csv" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" onChange={(event) => void onFileChange(event, "csv")} type="file" />
            <p className="text-xs text-zinc-500">CSV 第一行必须是表头，编码建议 UTF-8。</p>
          </label>

          <label className="space-y-1 text-sm text-zinc-700">
            <span className="font-medium">上传 JSON 文件</span>
            <input accept=".json" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" onChange={(event) => void onFileChange(event, "json")} type="file" />
            <p className="text-xs text-zinc-500">JSON 必须为数组格式。</p>
          </label>
        </div>

        <div className="mt-3 text-xs text-zinc-500">当前解析格式：{format.toUpperCase()}；文件名：{fileName || "未选择文件"}</div>

        <label className="mt-4 block space-y-1 text-sm text-zinc-700">
          <span className="font-medium">文本粘贴导入（可选）</span>
          <textarea
            className="min-h-[220px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={format === "csv" ? "粘贴 CSV 文本内容" : "粘贴 JSON 数组内容"}
            value={textInput}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={loading} onClick={parsePreview} type="button">
            {loading ? "解析中..." : "解析预览"}
          </button>
          <a className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700" href="/templates/projects-import-template.csv" rel="noreferrer" target="_blank">
            下载 CSV 模板
          </a>
          <a className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700" href="/templates/projects-import-template.json" rel="noreferrer" target="_blank">
            下载 JSON 模板
          </a>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
      </section>

      {preview ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">解析预览</h2>
            <div className="text-sm text-zinc-600">
              总计 {preview.summary.total} 条，
              可导入 {preview.summary.importable} 条，
              重复 {preview.summary.duplicates} 条，
              错误 {preview.summary.invalid} 条
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-separate border-spacing-0 rounded-xl border border-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">行号</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">项目名</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">分类</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">状态</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">官网</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">slug</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">校验状态</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">错误原因</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-left">重复</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.name}-${row.slug}`} className="align-top">
                    <td className="border-b border-zinc-100 px-3 py-2">{row.rowNumber}</td>
                    <td className="border-b border-zinc-100 px-3 py-2">{row.name || "-"}</td>
                    <td className="border-b border-zinc-100 px-3 py-2">
                      {Array.isArray(row.normalized?.categories) && row.normalized.categories.length > 0
                        ? row.normalized.categories.join("; ")
                        : row.category || "-"}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2">{row.status || "-"}</td>
                    <td className="border-b border-zinc-100 px-3 py-2">{row.websiteUrl || "-"}</td>
                    <td className="border-b border-zinc-100 px-3 py-2">{row.slug || "-"}</td>
                    <td className="border-b border-zinc-100 px-3 py-2">
                      {row.canImport ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">可导入</span>
                      ) : row.duplicate ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">重复将跳过</span>
                      ) : (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">校验失败</span>
                      )}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-red-700">{row.errors.join("；") || "-"}</td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-zinc-700">{row.duplicateReason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={loading || importableRows.length === 0}
            onClick={confirmImport}
            type="button"
          >
            {loading ? "导入中..." : "确认导入"}
          </button>

          {importResult ? (
            <section className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <p>成功数量：{importResult.success}</p>
              <p>跳过重复数量：{importResult.skipped}</p>
              <p>失败数量：{importResult.failed}</p>
              {importResult.failureReasons.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-red-700">
                  {importResult.failureReasons.map((item, index) => (
                    <li key={`${item.rowNumber}-${index}`}>第 {item.rowNumber} 行（{item.name}）：{item.reason}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
