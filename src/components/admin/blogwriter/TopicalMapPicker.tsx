"use client";

/**
 * ตัวเลือกหัวข้อจาก topical map 150 บท
 *
 * เลือกแถวแล้วข้อมูลทุกคอลัมน์ (keyword, slug, title, cluster, FAQ ฯลฯ)
 * จะถูกส่งไปเติมฟอร์ม Generate และฟอร์ม Publish อัตโนมัติ
 */
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../ToastProvider";
import { fetchTopicalMap } from "./api";
import { CLUSTERS } from "@/lib/clusters";
import type { TopicalMapRow } from "@/lib/blogwriter/topicalMap";

const STATUS_TONE: Record<string, string> = {
  ready: "bg-emerald-600/30 text-emerald-300",
  published: "bg-sky-600/30 text-sky-300",
  draft: "bg-amber-600/30 text-amber-300",
  hold: "bg-slate-600/40 text-slate-300",
};

export default function TopicalMapPicker({ onPick, onClose }: {
  onPick: (row: TopicalMapRow) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<TopicalMapRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchTopicalMap()
      .then(setRows)
      .catch((e) => {
        toast.error(`โหลด topical map ไม่สำเร็จ: ${(e as Error).message}`);
        onClose();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (clusterFilter && r.cluster !== clusterFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.title} ${r.primaryKeyword} ${r.seedKeyword} ${r.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, clusterFilter, statusFilter]);

  const statuses = useMemo(
    () => (rows ? [...new Set(rows.map((r) => r.status).filter(Boolean))] : []),
    [rows],
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-700 bg-slate-900 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-100">🗺️ Topical Map (150 บท)</p>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา keyword / title / slug"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <select
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">ทุก cluster</option>
              {CLUSTERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">ทุกสถานะ</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            {rows ? `${filtered.length} จาก ${rows.length} หัวข้อ` : "กำลังโหลด..."} — แถวสถานะ published คือบทที่ลงเว็บแล้ว เลือกซ้ำจะเป็นการเขียนทับ
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {rows === null && (
            <p className="p-6 text-center text-slate-400 text-sm">กำลังโหลดหัวข้อ...</p>
          )}
          {rows !== null && filtered.length === 0 && (
            <p className="p-6 text-center text-slate-400 text-sm">ไม่พบหัวข้อที่ตรงเงื่อนไข</p>
          )}
          {filtered.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => onPick(r)}
              className="w-full text-left p-4 hover:bg-slate-800/60 transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-100 text-sm">
                  {r.title || r.primaryKeyword}
                </span>
                {r.status && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_TONE[r.status] ?? "bg-slate-700 text-slate-300"}`}>
                    {r.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                🎯 {r.primaryKeyword} • {r.cluster} • /blog/{r.slug}
              </p>
              {r.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
