"use client";

/**
 * เลือกบทความเก่ามาแก้ไข — รายชื่อมาจาก repo จริง (ผ่าน GitHub API)
 * จึงเห็นบทความที่เพิ่ง commit แม้ Vercel ยัง deploy ไม่เสร็จ
 */
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../ToastProvider";
import { fetchPostList } from "./api";

export default function PostPicker({ onPick, onClose }: {
  onPick: (slug: string) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [posts, setPosts] = useState<{ slug: string; title: string; draft: boolean }[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPostList()
      .then(setPosts)
      .catch((e) => {
        toast.error(`โหลดรายชื่อบทความไม่สำเร็จ: ${(e as Error).message}`);
        onClose();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!posts) return [];
    const q = search.trim().toLowerCase();
    return q
      ? posts.filter((p) => p.slug.includes(q) || p.title.toLowerCase().includes(q))
      : posts;
  }, [posts, search]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[80vh] rounded-2xl border border-slate-700 bg-slate-900 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-100">✏️ แก้ไขบทความเก่า</p>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาจากชื่อบทความหรือ slug"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            {posts ? `${filtered.length} จาก ${posts.length} บทความใน repo` : "กำลังโหลด..."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {posts === null && <p className="p-6 text-center text-slate-400 text-sm">กำลังโหลดรายชื่อ...</p>}
          {posts !== null && filtered.length === 0 && (
            <p className="p-6 text-center text-slate-400 text-sm">ไม่พบบทความ</p>
          )}
          {filtered.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onPick(p.slug)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-colors space-y-0.5"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm text-slate-100 font-medium">
                  {p.title || p.slug}
                </span>
                {p.draft && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-300 shrink-0">
                    draft
                  </span>
                )}
                {!p.title && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-600/30 text-sky-300 shrink-0">
                    ใหม่ — รอ deploy
                  </span>
                )}
              </span>
              <span className="block text-xs text-slate-500 font-mono">/blog/{p.slug}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
