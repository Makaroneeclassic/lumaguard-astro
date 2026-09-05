"use client";

/**
 * ผลวิเคราะห์ SERP Spy — ported from smart-bot-writer v2.2
 * content.js renderSerpWidget (1153-1339)
 *
 * แท็บ 8 อัน + banner ผู้ชนะ + 3 สิ่งต้องทำก่อน + ปุ่มเติม outline / copy schema
 * ข้อมูลเป็นการจำลองจากความรู้ของโมเดล ไม่ใช่การ scrape SERP จริง
 */
import { useState } from "react";
import { useToast } from "../ToastProvider";
import type { SerpSpyData } from "./api";

const TABS = [
  { id: "serp", label: "SERP" },
  { id: "targets", label: "เป้าหมาย" },
  { id: "must", label: "ต้องมี" },
  { id: "gaps", label: "ช่องว่าง" },
  { id: "paa", label: "PAA" },
  { id: "related", label: "คำค้นใกล้เคียง" },
  { id: "outline", label: "Outline" },
  { id: "schema", label: "FAQ Schema" },
] as const;

export default function SerpSpyWidget({ data, keyword, onFillOutline }: {
  data: SerpSpyData;
  keyword: string;
  onFillOutline: (outlineText: string) => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<string>("serp");

  const outlineText = (data.h_structure ?? [])
    .map((h) => (h.level === "H3" ? `  - ${h.text}` : `${h.text}`))
    .join("\n");

  const schemaStr = data.faq_schema ? JSON.stringify(data.faq_schema, null, 2) : "";

  return (
    <div className="rounded-xl border border-violet-700/50 bg-violet-950/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-800/40 flex items-center justify-between">
        <p className="text-sm font-semibold text-violet-200">🕵️ SERP Spy: {keyword}</p>
        {outlineText && (
          <button
            type="button"
            onClick={() => onFillOutline(outlineText)}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-lg transition-colors"
          >
            📐 ใช้เป็น Outline
          </button>
        )}
      </div>

      {data.serp_winner && (
        <div className="px-4 py-2 bg-violet-900/30 text-xs text-violet-200 border-b border-violet-800/40">
          🏆 {data.serp_winner}
        </div>
      )}

      {(data.top3_actions?.length ?? 0) > 0 && (
        <div className="px-4 py-3 border-b border-violet-800/40 space-y-1.5">
          <p className="text-xs font-semibold text-violet-300">⚡ 3 สิ่งต้องทำก่อน</p>
          {data.top3_actions!.map((a) => (
            <p key={a.rank} className="text-xs text-slate-300">
              <span className="text-violet-400 font-bold">{a.rank}.</span> {a.action}{" "}
              <span className="text-slate-500">— {a.reason}</span>
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-slate-800 text-violet-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 p-4 text-sm max-h-96 overflow-y-auto">
        {tab === "serp" && (
          <div className="space-y-3">
            {(data.serp_cards ?? []).map((c) => (
              <div key={c.rank} className="rounded-lg border border-slate-700 p-3 space-y-1">
                <p className="font-semibold text-slate-100">
                  #{c.rank} {c.title}
                </p>
                <p className="text-xs text-slate-400">
                  {c.domain} • {c.content_type} • {c.word_count?.toLocaleString()} คำ • H2×{c.headings_h2} H3×{c.headings_h3}
                </p>
                <p className="text-xs text-slate-400">
                  {c.has_faq ? "✅ FAQ" : "— FAQ"} {c.has_table ? "✅ ตาราง" : "— ตาราง"} {c.has_video ? "✅ วิดีโอ" : "— วิดีโอ"}
                </p>
                <p className="text-xs text-emerald-400">จุดแข็ง: {c.strength}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "targets" && data.data_targets && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                ["จำนวนคำ", data.data_targets.word_count_target?.toLocaleString()],
                ["H2", data.data_targets.h2_count_target],
                ["H3", data.data_targets.h3_count_target],
                ["ตาราง", data.data_targets.table_count_target],
                ["FAQ", data.data_targets.faq_count_target],
                ["ลิงก์ภายใน", data.data_targets.internal_links_target],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-slate-700/50 p-2 text-center">
                  <p className="text-lg font-bold text-violet-300">{value ?? "-"}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">{data.data_targets.rationale}</p>
          </div>
        )}

        {tab === "must" && (
          <ul className="space-y-1.5">
            {(data.must_have ?? []).map((item, i) => (
              <li key={i} className="text-slate-300 text-xs">✅ {item}</li>
            ))}
          </ul>
        )}

        {tab === "gaps" && (
          <div className="space-y-2">
            {(data.gap_analysis ?? []).map((g, i) => (
              <div key={i} className="rounded-lg border border-slate-700 p-3 space-y-1">
                <p className="text-slate-100 text-xs font-semibold">
                  {"★".repeat(g.priority ?? 0)}{"☆".repeat(Math.max(0, 5 - (g.priority ?? 0)))} {g.opportunity}
                </p>
                <p className="text-xs text-slate-400">แรงที่ใช้: {g.effort} • ผลลัพธ์: {g.impact}</p>
                <p className="text-xs text-sky-300">→ {g.action}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "paa" && (
          <ol className="space-y-1.5 list-decimal list-inside">
            {(data.paa ?? []).map((q, i) => (
              <li key={i} className="text-slate-300 text-xs">{q}</li>
            ))}
          </ol>
        )}

        {tab === "related" && (
          <div className="flex flex-wrap gap-2">
            {(data.related_searches ?? []).map((r, i) => (
              <span key={i} className="text-xs bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full">{r}</span>
            ))}
          </div>
        )}

        {tab === "outline" && (
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
            {(data.h_structure ?? []).map((h) => `${h.level === "H3" ? "   └ H3: " : "H2: "}${h.text}`).join("\n")}
          </pre>
        )}

        {tab === "schema" && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(schemaStr).then(
                  () => toast.success("คัดลอก FAQ Schema แล้ว"),
                  () => toast.error("คัดลอกไม่สำเร็จ"),
                );
              }}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              📋 Copy Schema
            </button>
            <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{schemaStr}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
