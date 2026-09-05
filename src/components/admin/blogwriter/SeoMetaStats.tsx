"use client";

/**
 * แถบวัดความยาว SEO title / meta description
 * ported from smart-bot-writer v2.2 content.js showSeoMetaStats —
 * เกณฑ์ title 50-60 และ meta 140-155 ตัวอักษร (นับแบบ .length เท่ากับ
 * ที่ prompt สั่งโมเดลและ zod ใช้ ห้ามเปลี่ยนวิธีนับ)
 */

function judge(len: number, min: number, max: number): { label: string; tone: string } {
  if (len < min) return { label: "สั้นเกิน", tone: "text-amber-400" };
  if (len > max) return { label: "ยาวเกิน", tone: "text-red-400" };
  return { label: "ดี", tone: "text-emerald-400" };
}

function Bar({ name, value, min, max, hardMax }: {
  name: string; value: string; min: number; max: number; hardMax: number;
}) {
  const len = value.length;
  const verdict = judge(len, min, max);
  const pct = Math.min((len / hardMax) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{name}</span>
        <span className={verdict.tone}>
          {len} ตัวอักษร — {verdict.label} (เป้า {min}–{max})
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            verdict.label === "ดี" ? "bg-emerald-500" : verdict.label === "สั้นเกิน" ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SeoMetaStats({ title, metaDescription }: { title: string; metaDescription: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <Bar name="SEO Title" value={title} min={50} max={60} hardMax={70} />
      <Bar name="Meta Description" value={metaDescription} min={140} max={155} hardMax={160} />
    </div>
  );
}
