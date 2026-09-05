"use client";

/**
 * ฟอร์มสร้างบทความ — ported from smart-bot-writer v2.2 content.js
 *
 * โครงฟอร์มเรียงตาม extension เดิมทุก section ยกเว้น:
 *   - License gate ตัดออก (session admin ทำหน้าที่แทน)
 *   - Copy Rich / Insert to Doc ตัดออก (ผูกกับ Google Docs)
 *   - เพิ่มการดึงรายการลิงก์ภายในไปใส่ prompt (internal linking ของเว็บ)
 */
import { useEffect, useRef, useState } from "react";
import { useToast } from "../ToastProvider";
import {
  LANGUAGES, TEMPLATES, MODELS, MODEL_MIGRATIONS, MAX_TEMPLATE_FILE_SIZE, MAX_TOPICS,
  resolveLangName,
} from "@/lib/blogwriter/constants";
import { buildPrompt, buildSerpSpyPrompt, type InternalLink } from "@/lib/blogwriter/prompts";
import { htmlToMarkdown, boldClusterKeywords } from "@/lib/blogwriter/markdown";
import {
  callOpenRouter, fetchActiveModels, fetchInternalLinks, parseArticleResponse,
  type ArticleData, type SerpSpyData,
} from "./api";
import SerpSpyWidget from "./SerpSpyWidget";
import SeoMetaStats from "./SeoMetaStats";
import type { TopicalMapRow } from "@/lib/blogwriter/topicalMap";

/** ผลลัพธ์ที่ส่งต่อให้ PublishPanel */
export interface GeneratedResult {
  article: ArticleData;
  markdown: string;
  clusterKeywords: string;
  focusKeyword: string;
  serpData: SerpSpyData | null;
}

const LS = {
  apiKey: "lgw:apiKey",
  model: "lgw:model",
  template: "lgw:template",
  language: "lgw:language",
  persistentTemplate: "lgw:persistentTemplate",
  writerStyle: "lgw:writerStyle",
};

interface PersistentTemplate {
  content: string;
  name: string;
  source: string;
  updatedAt: string;
}

function Section({ title, badge, open, onToggle, children }: {
  title: string; badge?: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-left text-sm font-medium text-slate-200 transition-colors"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2 text-xs text-slate-400">
          {badge && <span className="rounded-full bg-sky-600/30 text-sky-300 px-2 py-0.5">{badge}</span>}
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="p-4 space-y-3 bg-slate-900/40">{children}</div>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none";

export default function GeneratorForm({ pickedRow, onGenerated }: {
  pickedRow: TopicalMapRow | null;
  onGenerated: (result: GeneratedResult) => void;
}) {
  const toast = useToast();

  // ── ค่าหลักของฟอร์ม ────────────────────────────────────────────
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [clusterKeywords, setClusterKeywords] = useState("");
  const [language, setLanguage] = useState("th");
  const [customLanguage, setCustomLanguage] = useState("");
  const [model, setModel] = useState(MODELS[1].value); // GPT-4.1 Mini (Recommended)
  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [customTemplate, setCustomTemplate] = useState("");
  const [writerStyleOn, setWriterStyleOn] = useState(false);
  const [writerStyle, setWriterStyle] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [outline, setOutline] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // ── Template Instructions ถาวร ─────────────────────────────────
  const [persistent, setPersistent] = useState<PersistentTemplate | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── สถานะการทำงาน ─────────────────────────────────────────────
  const [activeModels, setActiveModels] = useState<Set<string> | null>(null);
  const [serpData, setSerpData] = useState<SerpSpyData | null>(null);
  const [serpLoading, setSerpLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, text: "" });
  const [elapsed, setElapsed] = useState(0);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const internalLinksRef = useRef<InternalLink[]>([]);

  const toggleSection = (name: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // ── โหลดค่าที่จำไว้ + เช็คโมเดล + ลิงก์ภายใน ──────────────────
  useEffect(() => {
    const savedKey = localStorage.getItem(LS.apiKey) ?? "";
    setApiKey(savedKey);
    setApiKeySaved(Boolean(savedKey));
    if (!savedKey) setOpenSections((prev) => new Set(prev).add("api"));

    // remap โมเดลเก่าที่เลิกบริการ (ตาม extension content.js:846-850)
    const savedModel = localStorage.getItem(LS.model);
    if (savedModel) {
      const migrated = MODEL_MIGRATIONS[savedModel] ?? savedModel;
      if (MODELS.some((m) => m.value === migrated)) setModel(migrated);
    }
    const savedTemplate = localStorage.getItem(LS.template);
    if (savedTemplate && TEMPLATES.some((t) => t.value === savedTemplate)) setTemplate(savedTemplate);
    const savedLanguage = localStorage.getItem(LS.language);
    if (savedLanguage && LANGUAGES.some((l) => l.value === savedLanguage)) setLanguage(savedLanguage);
    const savedStyle = localStorage.getItem(LS.writerStyle);
    if (savedStyle) { setWriterStyle(savedStyle); }

    try {
      const raw = localStorage.getItem(LS.persistentTemplate);
      if (raw) setPersistent(JSON.parse(raw));
    } catch { /* ค่าเสียก็เริ่มใหม่ */ }

    fetchActiveModels()
      .then((ids) => setActiveModels(new Set(ids)))
      .catch(() => toast.warning("เช็คสถานะโมเดลไม่สำเร็จ — ใช้รายการทั้งหมดไปก่อน"));
    fetchInternalLinks()
      .then((links) => { internalLinksRef.current = links; })
      .catch(() => { /* ไม่มีลิงก์ = prompt ใช้กติกาห้ามลิงก์แบบเดิม */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // โมเดลที่เลือกอยู่ใช้ไม่ได้ → สลับไปตัวแรกที่ใช้ได้ (ตาม extension)
  useEffect(() => {
    if (activeModels && !activeModels.has(model)) {
      const firstActive = MODELS.find((m) => activeModels.has(m.value));
      if (firstActive) {
        setModel(firstActive.value);
        toast.info(`โมเดลเดิมใช้ไม่ได้แล้ว สลับเป็น ${firstActive.label}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModels]);

  // ── prefill จาก topical map ───────────────────────────────────
  useEffect(() => {
    if (!pickedRow) return;
    setKeyword(pickedRow.primaryKeyword || pickedRow.seedKeyword);
    setClusterKeywords(pickedRow.secondaryKeywords);
    const context = [
      pickedRow.description && `แนวเนื้อหา: ${pickedRow.description}`,
      pickedRow.seedKeyword && `seed keyword: ${pickedRow.seedKeyword}`,
    ].filter(Boolean).join("\n");
    if (context) setAdditionalContext(context);
    toast.success("เติมข้อมูลจาก Topical Map แล้ว");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedRow]);

  // ── ตัวจับเวลา ────────────────────────────────────────────────
  useEffect(() => {
    if (!generating && !serpLoading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [generating, serpLoading]);

  function saveApiKey() {
    const trimmed = apiKey.trim();
    if (!trimmed) { toast.error("กรุณาใส่ API key ก่อน"); return; }
    localStorage.setItem(LS.apiKey, trimmed);
    setApiKeySaved(true);
    toast.success("บันทึก API key ในเครื่องนี้แล้ว");
  }

  // ── Template Instructions ถาวร (autosave 500ms ตาม extension) ──
  function schedulePersistentSave(content: string, name: string, source: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const data: PersistentTemplate = { content, name, source, updatedAt: new Date().toISOString() };
      localStorage.setItem(LS.persistentTemplate, JSON.stringify(data));
      setPersistent(data);
    }, 500);
  }

  function handleTemplateFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_TEMPLATE_FILE_SIZE) {
      toast.error("ไฟล์ใหญ่เกิน 512 KB");
      return;
    }
    if (!/\.(txt|md|markdown|html|json)$/i.test(file.name)) {
      toast.error("รองรับเฉพาะ .txt .md .markdown .html .json");
      return;
    }
    file.text().then((text) => {
      setCustomTemplate(text);
      schedulePersistentSave(text, file.name, "file");
      toast.success(`แนบไฟล์ ${file.name} แล้ว`);
    });
  }

  function clearPersistentTemplate() {
    localStorage.removeItem(LS.persistentTemplate);
    setPersistent(null);
    setCustomTemplate("");
  }

  // โหลด template ถาวรเข้า textarea ครั้งแรก
  useEffect(() => {
    if (persistent && !customTemplate) setCustomTemplate(persistent.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistent]);

  // ── SERP Spy ──────────────────────────────────────────────────
  async function handleSerpSpy() {
    const kw = keyword.trim();
    if (!kw) { toast.error("ใส่ Focus Keyword ก่อน"); return; }
    const key = localStorage.getItem(LS.apiKey);
    if (!key) { toast.error("บันทึก API key ก่อน"); setOpenSections((p) => new Set(p).add("api")); return; }
    if (language === "other" && !customLanguage.trim()) { toast.error("ระบุภาษาในช่อง custom ก่อน"); return; }

    setSerpLoading(true);
    setSerpData(null);
    try {
      const langName = resolveLangName(language, customLanguage.trim());
      const { content } = await callOpenRouter({
        apiKey: key,
        model,
        messages: [
          { role: "system", content: buildSerpSpyPrompt(kw, langName) },
          { role: "user", content: `Analyze the SERP for "${kw}" and return the JSON.` },
        ],
        maxTokens: 8192,
      });
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("โมเดลไม่ตอบเป็น JSON ลองกดใหม่");
      const data: SerpSpyData = JSON.parse(jsonMatch[0]);
      setSerpData(data);

      // auto-fill outline จาก h_structure (ตาม extension content.js:1123-1137)
      if (data.h_structure?.length) {
        const outlineText = data.h_structure
          .map((h) => (h.level === "H3" ? `  - ${h.text}` : `${h.text}`))
          .join("\n");
        setOutline(outlineText);
        setOpenSections((p) => new Set(p).add("outline"));
      }
      toast.success(`วิเคราะห์ SERP เสร็จ (${elapsed}s)`);
    } catch (e) {
      toast.error(`SERP Spy: ${(e as Error).message}`);
    } finally {
      setSerpLoading(false);
    }
  }

  // ── Generate ──────────────────────────────────────────────────
  async function handleGenerate() {
    const kw = keyword.trim();
    if (!kw) { toast.error("ใส่ Focus Keyword ก่อน"); return; }
    const key = localStorage.getItem(LS.apiKey);
    if (!key) { toast.error("บันทึก API key ก่อน"); setOpenSections((p) => new Set(p).add("api")); return; }
    if (language === "other" && !customLanguage.trim()) { toast.error("ระบุภาษาในช่อง custom ก่อน"); return; }

    localStorage.setItem(LS.model, model);
    localStorage.setItem(LS.template, template);
    localStorage.setItem(LS.language, language);
    if (writerStyle.trim()) localStorage.setItem(LS.writerStyle, writerStyle);

    setGenerating(true);
    setArticle(null);
    setProgress({ pct: 20, text: "🤖 กำลังเขียนบทความ..." });
    try {
      const prompt = buildPrompt(kw, template, language, additionalContext.trim(), {
        topics: topics.map((t) => t.trim()).filter(Boolean),
        clusterKeywords: clusterKeywords.trim(),
        outline: outline.trim(),
        writerStyle: writerStyleOn ? writerStyle.trim() : "",
        customLanguage: customLanguage.trim(),
        customTemplate: customTemplate.trim(),
        internalLinks: internalLinksRef.current,
      });

      const { content, finishReason } = await callOpenRouter({
        apiKey: key,
        model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Write an article about "${kw}" and return the result as JSON as specified.` },
        ],
        maxTokens: 8192,
      });

      setProgress({ pct: 65, text: "📄 กำลังประมวลผล..." });
      if (finishReason === "length") {
        toast.warning("คำตอบถูกตัดกลางทาง — บทความอาจไม่จบ ลองโมเดลอื่นหรือกดใหม่");
      }

      const parsed = parseArticleResponse(content, kw);
      setArticle(parsed);

      // แปลงเป็น markdown ตาม pipeline ของ extension (htmlToMarkdown → bold)
      const markdown = boldClusterKeywords(
        htmlToMarkdown(parsed.content).replace(/^#\s+.*(?:\n+|$)/, "").trim(),
        clusterKeywords.trim(),
      );

      onGenerated({
        article: parsed,
        markdown,
        clusterKeywords: clusterKeywords.trim(),
        focusKeyword: kw,
        serpData,
      });

      setProgress({ pct: 100, text: "✅ เสร็จแล้ว" });
      toast.success(`🎉 บทความพร้อมแล้ว (${elapsed}s) — ตรวจแล้วกดบันทึกด้านล่าง`);
    } catch (e) {
      toast.error(`สร้างบทความไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`คัดลอก ${label} แล้ว`);
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  }

  const markdownForCopy = article
    ? boldClusterKeywords(
        htmlToMarkdown(article.content).replace(/^#\s+.*(?:\n+|$)/, "").trim(),
        clusterKeywords.trim(),
      )
    : "";

  return (
    <div className="space-y-4">
      {/* API key */}
      <Section
        title="🔑 OpenRouter API Key"
        badge={apiKeySaved ? "บันทึกแล้ว" : "ยังไม่ตั้ง"}
        open={openSections.has("api")}
        onToggle={() => toggleSection("api")}
      >
        <p className="text-xs text-slate-400">
          เก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น สร้าง key ได้ที่ openrouter.ai/keys
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className={inputCls}
          />
          <button type="button" onClick={saveApiKey} className="shrink-0 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            บันทึก
          </button>
        </div>
      </Section>

      {/* Focus keyword + SERP Spy */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">🎯 Focus Keyword</label>
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSerpSpy(); }}
            placeholder="เช่น ฟิล์มกรองแสงบ้าน"
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleSerpSpy}
            disabled={serpLoading || generating}
            className="shrink-0 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {serpLoading ? `🕵️ ${elapsed}s...` : "🕵️ SERP Spy"}
          </button>
        </div>
      </div>

      {serpData && (
        <SerpSpyWidget
          data={serpData}
          keyword={keyword}
          onFillOutline={(text) => {
            setOutline(text);
            setOpenSections((p) => new Set(p).add("outline"));
            toast.success("เติม outline จาก SERP Spy แล้ว");
          }}
        />
      )}

      {/* Cluster keywords */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">🔗 Cluster Keywords (คั่นด้วย , หรือขึ้นบรรทัดใหม่)</label>
        <textarea
          value={clusterKeywords}
          onChange={(e) => setClusterKeywords(e.target.value)}
          rows={2}
          placeholder="ฟิล์มกรองแสง, ฟิล์มกันร้อน, ติดฟิล์มบ้าน"
          className={inputCls}
        />
      </div>

      {/* Language / Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">🌐 ภาษา</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          {language === "other" && (
            <input
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="ระบุภาษา เช่น Vietnamese"
              className={inputCls}
            />
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            🤖 โมเดล{" "}
            <span className="text-xs text-slate-500">
              {activeModels === null ? "(กำลังเช็ค...)" : `(${activeModels.size}/${MODELS.length} ใช้ได้)`}
            </span>
          </label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className={inputCls}>
            {MODELS.map((m) => {
              const disabled = activeModels !== null && !activeModels.has(m.value);
              return (
                <option key={m.value} value={m.value} disabled={disabled}>
                  {m.label}{disabled ? " — unavailable" : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Template */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">📄 Base Template</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)} className={inputCls}>
          {[...new Set(TEMPLATES.map((t) => t.category))].map((cat) => (
            <optgroup key={cat} label={cat}>
              {TEMPLATES.filter((t) => t.category === cat).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Template Instructions ถาวร */}
      <Section
        title="📋 Template Instructions (จำถาวรในเครื่องนี้)"
        badge={persistent ? `ใช้อยู่: ${persistent.name}` : undefined}
        open={openSections.has("instructions")}
        onToggle={() => toggleSection("instructions")}
      >
        <textarea
          value={customTemplate}
          onChange={(e) => {
            setCustomTemplate(e.target.value);
            schedulePersistentSave(e.target.value, "Typed instructions", "text");
          }}
          rows={5}
          placeholder="คำสั่งเพิ่มเติมที่อยากให้ AI ทำตามทุกครั้ง เช่น โทนภาษา ข้อห้าม โครงที่ชอบ"
          className={inputCls}
        />
        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
            📎 แนบไฟล์ (.txt .md .html .json ≤512KB)
            <input type="file" accept=".txt,.md,.markdown,.html,.json" onChange={handleTemplateFile} className="hidden" />
          </label>
          {persistent && (
            <button type="button" onClick={clearPersistentTemplate} className="text-xs text-red-400 hover:text-red-300">
              ล้างค่า
            </button>
          )}
        </div>
      </Section>

      {/* Writer style */}
      <Section
        title="✍️ Writer Style / Persona"
        badge={writerStyleOn ? "เปิด" : undefined}
        open={openSections.has("style")}
        onToggle={() => toggleSection("style")}
      >
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={writerStyleOn} onChange={(e) => setWriterStyleOn(e.target.checked)} />
          ใช้ persona ตอนเขียน
        </label>
        <textarea
          value={writerStyle}
          onChange={(e) => setWriterStyle(e.target.value)}
          rows={3}
          disabled={!writerStyleOn}
          placeholder="เช่น วิศวกรฟิล์มอาคารที่อธิบายเรื่องเทคนิคให้คนทั่วไปเข้าใจง่าย"
          className={`${inputCls} disabled:opacity-50`}
        />
      </Section>

      {/* Headings */}
      <Section
        title="📌 หัวข้อบังคับ (H2)"
        badge={topics.filter((t) => t.trim()).length ? `${topics.filter((t) => t.trim()).length} หัวข้อ` : undefined}
        open={openSections.has("topics")}
        onToggle={() => toggleSection("topics")}
      >
        {topics.map((t, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={t}
              onChange={(e) => setTopics((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={`H2 หัวข้อที่ ${i + 1}`}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setTopics((prev) => prev.filter((_, j) => j !== i))}
              className="shrink-0 text-red-400 hover:text-red-300 px-2"
            >
              ✕
            </button>
          </div>
        ))}
        {topics.length < MAX_TOPICS && (
          <button type="button" onClick={() => setTopics((prev) => [...prev, ""])} className="text-xs text-sky-400 hover:text-sky-300">
            + เพิ่มหัวข้อ (สูงสุด {MAX_TOPICS})
          </button>
        )}
        <p className="text-xs text-slate-500">ถ้าใส่ Outline ด้านล่าง ระบบจะใช้ Outline แทนหัวข้อบังคับ</p>
      </Section>

      {/* Outline */}
      <Section
        title="📐 Outline (จาก SERP Spy หรือพิมพ์เอง)"
        badge={outline.trim() ? `${outline.split("\n").filter((l) => l.trim()).length} บรรทัด` : undefined}
        open={openSections.has("outline")}
        onToggle={() => toggleSection("outline")}
      >
        <textarea
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          rows={8}
          placeholder={"หัวข้อ H2\n  - หัวข้อย่อย H3\nหัวข้อ H2 ถัดไป"}
          className={`${inputCls} font-mono text-xs`}
        />
        {outline.trim() && (
          <button type="button" onClick={() => setOutline("")} className="text-xs text-red-400 hover:text-red-300">
            ล้าง outline
          </button>
        )}
      </Section>

      {/* Additional context */}
      <Section
        title="ℹ️ ข้อมูลเพิ่มเติมประกอบการเขียน"
        badge={additionalContext.trim() ? "มีข้อมูล" : undefined}
        open={openSections.has("context")}
        onToggle={() => toggleSection("context")}
      >
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={4}
          placeholder="ข้อเท็จจริง สเปกสินค้า ราคา หรือบริบทที่อยากให้ใส่ในบทความ"
          className={inputCls}
        />
      </Section>

      {/* Generate */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || serpLoading}
        className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-base transition-colors"
      >
        {generating ? `⏳ กำลังเขียน... ${elapsed}s` : "🚀 Generate Article"}
      </button>

      {generating && (
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${progress.pct}%` }} />
        </div>
      )}

      {/* ผลลัพธ์ */}
      {article && (
        <div className="space-y-3">
          <SeoMetaStats title={article.title} metaDescription={article.metaDescription} />
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 space-y-2">
            <p className="font-bold text-slate-100">{article.title}</p>
            <p className="text-sm text-slate-400">{article.metaDescription}</p>
          </div>
          <textarea
            readOnly
            value={article.content}
            rows={12}
            className={`${inputCls} font-mono text-xs`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyText(article.content, "HTML")}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              📋 Copy HTML
            </button>
            <button
              type="button"
              onClick={() => copyText(markdownForCopy, "Markdown")}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              📝 Copy Markdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
