"use client";

/**
 * ฟอร์มบันทึกบทความลงเว็บ — commit เข้า GitHub main → Vercel deploy เอง
 *
 * แสดงหลัง Generate เสร็จ ให้ตรวจ/เติม frontmatter ตาม schema ของเว็บ
 * (content.config.ts) ก่อนกดบันทึก ค่าถูก prefill จากผลลัพธ์ AI +
 * แถว topical map ที่เลือกไว้ + FAQ จาก SERP Spy
 */
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../ToastProvider";
import { CLUSTERS } from "@/lib/clusters";
import { publishPayloadSchema } from "@/lib/blogwriter/validation";
import { publishPost } from "./api";
import type { GeneratedResult } from "./GeneratorForm";
import type { TopicalMapRow } from "@/lib/blogwriter/topicalMap";

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none";

interface FaqRow { q: string; a: string }

/** แปลงคอลัมน์ faq ของชีต ("คำถาม | คำตอบ" บรรทัดละข้อ) เป็นรายการ */
function parseSheetFaq(faq: string): FaqRow[] {
  return faq
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [q, ...rest] = l.split("|");
      return { q: (q ?? "").trim(), a: rest.join("|").trim() };
    })
    .filter((f) => f.q && f.a);
}

function todayISO(): string {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

export default function PublishPanel({ result, pickedRow }: {
  result: GeneratedResult;
  pickedRow: TopicalMapRow | null;
}) {
  const toast = useToast();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [cluster, setCluster] = useState<string>(CLUSTERS[0]);
  const [pillar, setPillar] = useState("");
  const [relatedServiceUrl, setRelatedServiceUrl] = useState("/products");
  const [pubDate, setPubDate] = useState(todayISO());
  const [heroImage, setHeroImage] = useState("");
  const [heroAlt, setHeroAlt] = useState("");
  const [author, setAuthor] = useState("ทีมงานวิศวกร LUMAGUARD");
  const [tags, setTags] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [showInGoogle, setShowInGoogle] = useState(true);
  const [insertCta, setInsertCta] = useState(true);
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ blogUrl: string; commitUrl: string; draft: boolean } | null>(null);

  // ── prefill เมื่อผลลัพธ์ใหม่มาถึง ──────────────────────────────
  useEffect(() => {
    setTitle(result.article.title);
    setDescription(result.article.metaDescription);
    setPrimaryKeyword(pickedRow?.primaryKeyword || result.focusKeyword);
    setMarkdown(result.markdown);
    setDone(null);

    if (pickedRow) {
      setSlug(pickedRow.slug);
      setSecondaryKeywords(pickedRow.secondaryKeywords);
      if ((CLUSTERS as readonly string[]).includes(pickedRow.cluster)) setCluster(pickedRow.cluster);
      setPillar(pickedRow.pillar);
      if (pickedRow.relatedServiceUrl.startsWith("/")) setRelatedServiceUrl(pickedRow.relatedServiceUrl);
      if (/^\d{4}-\d{2}-\d{2}$/.test(pickedRow.pubDate)) setPubDate(pickedRow.pubDate);
      if (pickedRow.author) setAuthor(pickedRow.author);
      setTags(pickedRow.tags);
      setShowInGoogle(pickedRow.showInGoogle);
      const sheetFaq = parseSheetFaq(pickedRow.faq);
      if (sheetFaq.length) setFaq(sheetFaq);
    } else {
      // เดา slug จาก keyword — ใช้ได้เฉพาะอักษรละติน ผู้ใช้แก้เองได้
      const guess = result.focusKeyword
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(guess);
      const kws = result.clusterKeywords.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean);
      setSecondaryKeywords(kws.slice(0, 5).join(", "));
      setTags(kws.slice(0, 4).join(", "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  function useSerpFaq() {
    const entities = result.serpData?.faq_schema?.mainEntity ?? [];
    const rows = entities
      .map((e) => ({ q: e.name ?? "", a: e.acceptedAnswer?.text ?? "" }))
      .filter((f) => f.q && f.a);
    if (!rows.length) { toast.warning("ไม่มี FAQ จาก SERP Spy — รัน SERP Spy ก่อน"); return; }
    setFaq(rows);
    toast.success(`เติม FAQ ${rows.length} ข้อจาก SERP Spy แล้ว`);
  }

  const list = (v: string) => v.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);

  const frontmatter = useMemo(
    () => ({
      title: title.trim(),
      description: description.trim(),
      primaryKeyword: primaryKeyword.trim(),
      secondaryKeywords: list(secondaryKeywords).slice(0, 5),
      cluster,
      pillar: pillar.trim() || undefined,
      relatedServiceUrl: relatedServiceUrl.trim(),
      pubDate,
      heroImage: heroImage.trim() || undefined,
      heroAlt: heroAlt.trim() || undefined,
      author: author.trim() || "ทีมงานวิศวกร LUMAGUARD",
      tags: list(tags).slice(0, 4),
      draft: !publishNow,
      noindex: !showInGoogle,
      faq: faq.filter((f) => f.q.trim() && f.a.trim()).length
        ? faq.filter((f) => f.q.trim() && f.a.trim())
        : undefined,
    }),
    [title, description, primaryKeyword, secondaryKeywords, cluster, pillar, relatedServiceUrl,
     pubDate, heroImage, heroAlt, author, tags, publishNow, showInGoogle, faq],
  );

  /**
   * แทรก CTA กลางบทความ — วาง <ArticleCta position="inline" /> หลังจบ
   * section ของ H2 กลางเรื่อง (ก่อนขึ้น H2 ถัดไป) component นี้เว็บ
   * ลงทะเบียนไว้ใน <Content components={{ ArticleCta }} /> อยู่แล้ว
   */
  const finalMarkdown = useMemo(() => {
    if (!insertCta) return markdown;
    const lines = markdown.split("\n");
    const h2Indexes = lines.reduce<number[]>((acc, l, i) => {
      if (/^##\s/.test(l)) acc.push(i);
      return acc;
    }, []);
    if (h2Indexes.length < 2) return markdown;
    const midH2 = h2Indexes[Math.floor(h2Indexes.length / 2)];
    const cta = `\n<ArticleCta href="${relatedServiceUrl.trim() || "/products"}" position="inline" />\n`;
    return [...lines.slice(0, midH2), cta, ...lines.slice(midH2)].join("\n");
  }, [markdown, insertCta, relatedServiceUrl]);

  async function handleSave(overwrite = false) {
    const payload = { slug: slug.trim(), frontmatter, markdownBody: finalMarkdown, overwrite };

    const check = publishPayloadSchema.safeParse(payload);
    if (!check.success) {
      const first = check.error.issues[0];
      toast.error(`ตรวจไม่ผ่าน: ${first.path.join(".")} — ${first.message}`);
      return;
    }

    setSaving(true);
    try {
      const res = await publishPost(payload);
      setDone({ blogUrl: res.blogUrl, commitUrl: res.commitUrl, draft: !publishNow });
      toast.success(
        publishNow
          ? "🎉 บันทึกแล้ว — Vercel กำลัง deploy บทความจะขึ้นเว็บใน ~2 นาที"
          : "💾 บันทึกเป็น draft แล้ว — ยังไม่แสดงบนเว็บจนกว่าจะเผยแพร่",
      );
    } catch (e) {
      const err = e as Error & { reason?: string };
      if (err.reason === "slug-exists") {
        const ok = window.confirm(`มีบทความ slug "${slug}" อยู่แล้ว ต้องการเขียนทับหรือไม่?`);
        if (ok) { setSaving(false); return handleSave(true); }
      } else {
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/10 p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-emerald-300">💾 บันทึกลงบล็อก</p>
        <p className="text-xs text-slate-500">commit → GitHub → Vercel deploy อัตโนมัติ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-slate-400">Slug (URL: /blog/…)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="film-krong-saeng-baan" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-slate-400">
            Title <span className={title.length > 70 ? "text-red-400" : "text-slate-500"}>({title.length}/70)</span>
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-slate-400">
            Description{" "}
            <span className={description.length < 80 || description.length > 160 ? "text-amber-400" : "text-slate-500"}>
              ({description.length}/80–160)
            </span>
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Primary Keyword (ห้ามซ้ำกับบทอื่น)</label>
          <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Secondary Keywords (≤5, คั่น ,)</label>
          <input value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Cluster</label>
          <select value={cluster} onChange={(e) => setCluster(e.target.value)} className={inputCls}>
            {CLUSTERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Pillar (ไม่บังคับ)</label>
          <input value={pillar} onChange={(e) => setPillar(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Related Service URL (CTA ชี้ไปหน้าขาย)</label>
          <input value={relatedServiceUrl} onChange={(e) => setRelatedServiceUrl(e.target.value)} className={inputCls} placeholder="/products" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">วันที่เผยแพร่ (YYYY-MM-DD)</label>
          <input value={pubDate} onChange={(e) => setPubDate(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Hero Image (path ใต้ /public เช่น /images/blog/x.webp — ไม่บังคับ)</label>
          <input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Hero Alt (บังคับเมื่อมีรูป)</label>
          <input value={heroAlt} onChange={(e) => setHeroAlt(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">ผู้เขียน</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Tags (≤4, คั่น ,)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">FAQ (ลง schema FAQPage ให้ Google อัตโนมัติ)</label>
          <button type="button" onClick={useSerpFaq} className="text-xs text-violet-400 hover:text-violet-300">
            🕵️ ใช้ FAQ จาก SERP Spy
          </button>
        </div>
        {faq.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={f.q}
              onChange={(e) => setFaq((prev) => prev.map((v, j) => (j === i ? { ...v, q: e.target.value } : v)))}
              placeholder="คำถาม"
              className={inputCls}
            />
            <input
              value={f.a}
              onChange={(e) => setFaq((prev) => prev.map((v, j) => (j === i ? { ...v, a: e.target.value } : v)))}
              placeholder="คำตอบ"
              className={inputCls}
            />
            <button type="button" onClick={() => setFaq((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-red-400 hover:text-red-300 px-1">
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setFaq((prev) => [...prev, { q: "", a: "" }])} className="text-xs text-sky-400 hover:text-sky-300">
          + เพิ่ม FAQ
        </button>
      </div>

      {/* เนื้อหา markdown แก้ได้ */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">เนื้อหา (Markdown — แก้ได้ก่อนบันทึก)</label>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={14}
          className={`${inputCls} font-mono text-xs`}
        />
      </div>

      {/* ตัวเลือก */}
      <div className="flex flex-col gap-2 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={insertCta} onChange={(e) => setInsertCta(e.target.checked)} />
          แทรกกล่อง CTA ขอใบเสนอราคากลางบทความ
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showInGoogle} onChange={(e) => setShowInGoogle(e.target.checked)} />
          ให้ Google ค้นเจอบทความนี้ (ปิด = noindex)
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
          เผยแพร่ทันที (ไม่ติ๊ก = บันทึกเป็น draft ยังไม่แสดงบนเว็บ)
        </label>
      </div>

      <button
        type="button"
        onClick={() => handleSave(false)}
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
      >
        {saving ? "⏳ กำลังบันทึก..." : publishNow ? "🚀 บันทึกและเผยแพร่ขึ้นเว็บ" : "💾 บันทึกเป็น Draft"}
      </button>

      {done && (
        <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 p-4 text-sm space-y-1">
          <p className="text-emerald-300 font-semibold">
            {done.draft ? "บันทึก draft สำเร็จ" : "บันทึกสำเร็จ — Vercel กำลัง deploy (~2 นาที)"}
          </p>
          {!done.draft && (
            <p className="text-slate-300">
              ลิงก์บทความ:{" "}
              <a href={done.blogUrl} target="_blank" rel="noopener" className="text-sky-400 hover:underline">
                {done.blogUrl}
              </a>
            </p>
          )}
          {done.commitUrl && (
            <p className="text-slate-400">
              <a href={done.commitUrl} target="_blank" rel="noopener" className="hover:underline">
                ดู commit บน GitHub ↗
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
