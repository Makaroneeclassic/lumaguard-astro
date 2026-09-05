"use client";

/**
 * เครื่องมือเขียนบทความด้วย AI — island หลักของหน้า /admin/blog
 *
 * ย้ายความสามารถมาจาก Chrome extension "Smart Bot Writer v2.2" ทั้งหมด
 * ตัว island ครอบทุกอย่างด้วย ToastProvider ตัวเดียว — แยกเป็นหลาย island
 * ไม่ได้เพราะ React context ข้าม island กันไม่ได้ (บทเรียนจาก AdminDashboard)
 */
import { useState } from "react";
import { ToastProvider } from "../ToastProvider";
import GeneratorForm, { type GeneratedResult } from "./GeneratorForm";
import PublishPanel from "./PublishPanel";
import TopicalMapPicker from "./TopicalMapPicker";
import type { TopicalMapRow } from "@/lib/blogwriter/topicalMap";

export default function BlogWriter() {
  const [pickedRow, setPickedRow] = useState<TopicalMapRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div>
            <p className="font-semibold text-slate-100">เริ่มจากแผน Topical Map (150 บท)</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {pickedRow
                ? `เลือกไว้: ${pickedRow.title || pickedRow.primaryKeyword} (${pickedRow.status || "ไม่มีสถานะ"})`
                : "เลือกหัวข้อเพื่อเติม keyword, slug, cluster และ FAQ ให้อัตโนมัติ"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="shrink-0 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            🗺️ เลือกหัวข้อ
          </button>
        </div>

        {pickerOpen && (
          <TopicalMapPicker
            onPick={(row) => {
              setPickedRow(row);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}

        <GeneratorForm pickedRow={pickedRow} onGenerated={setResult} />

        {result && <PublishPanel result={result} pickedRow={pickedRow} />}
      </div>
    </ToastProvider>
  );
}
