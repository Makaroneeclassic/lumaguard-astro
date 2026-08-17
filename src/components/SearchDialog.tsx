import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface PagefindResultData {
  url: string;
  meta?: { title?: string };
  excerpt?: string;
}

interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

interface PagefindApi {
  options: (opts: Record<string, unknown>) => Promise<void>;
  search: (term: string) => Promise<{ results: PagefindResult[] }>;
}

/**
 * ช่องค้นหาทั้งเว็บ ใช้ดัชนีที่ Pagefind สร้างตอน build
 *
 * ตัวดัชนีและสคริปต์ของ Pagefind โหลดแบบ lazy เมื่อผู้ใช้เปิดกล่องค้นหา
 * ครั้งแรกเท่านั้น จึงไม่มีผลกับ LCP ของหน้าเว็บ
 */
export default function SearchDialog({ label = "ค้นหา" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const pagefind = useRef<PagefindApi | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // โหลด Pagefind ครั้งเดียวตอนเปิดกล่องค้นหา
  useEffect(() => {
    if (!open || pagefind.current) return;

    (async () => {
      try {
        // เก็บ path ไว้ในตัวแปรก่อน เพื่อไม่ให้ bundler วิเคราะห์ปลายทางได้
        // ไฟล์นี้ถูก Pagefind สร้างขึ้นหลัง build เสร็จ จึงยังไม่มีอยู่ตอน bundle
        // (ในโหมด dev ก็ยังไม่มีเช่นกัน ตัว catch จะพาไปแสดงข้อความสำรองแทน)
        const modulePath = "/pagefind/pagefind.js";
        const mod = (await import(/* @vite-ignore */ modulePath)) as unknown as PagefindApi;
        await mod.options({ excerptLength: 25 });
        pagefind.current = mod;
      } catch {
        setFailed(true);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // ปิดด้วย Escape และเปิดด้วย Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term || !pagefind.current) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // หน่วงเล็กน้อยกันยิงค้นหาทุกครั้งที่พิมพ์
    const timer = setTimeout(async () => {
      try {
        const search = await pagefind.current!.search(term);
        const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container-low transition-colors"
      >
        <Search className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-24"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="ค้นหาในเว็บไซต์"
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาบทความ สินค้า หรือบริการ..."
                aria-label="คำค้นหา"
                className="flex-1 py-4 text-slate-900 placeholder-slate-400 outline-none bg-transparent"
              />
              {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" aria-hidden="true" />}
              <button
                type="button"
                aria-label="ปิดการค้นหา"
                onClick={() => setOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto" aria-live="polite">
              {failed && (
                <p className="p-6 text-sm text-slate-500">
                  ระบบค้นหาใช้งานไม่ได้ในขณะนี้ กรุณาเลือกจากเมนูด้านบนแทน
                </p>
              )}

              {!failed && query.trim() && !loading && results.length === 0 && (
                <p className="p-6 text-sm text-slate-500">
                  ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;
                </p>
              )}

              {!failed && !query.trim() && (
                <p className="p-6 text-sm text-slate-400">
                  พิมพ์คำที่ต้องการค้นหา เช่น ฟิล์มนิรภัย, Guardian, ราคา
                </p>
              )}

              <ul>
                {results.map((r) => (
                  <li key={r.url} className="border-b border-slate-100 last:border-0">
                    <a href={r.url} className="block px-5 py-4 hover:bg-slate-50 transition-colors">
                      <p className="font-bold text-slate-900">{r.meta?.title ?? r.url}</p>
                      {r.excerpt && (
                        <p
                          className="mt-1 text-sm text-slate-500 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: r.excerpt }}
                        />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
