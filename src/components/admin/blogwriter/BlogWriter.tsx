"use client";

/**
 * เครื่องมือเขียนบทความด้วย AI — island หลักของหน้า /admin/blog
 *
 * ย้ายความสามารถมาจาก Chrome extension "Smart Bot Writer v2.2" ทั้งหมด
 * ตัว island ครอบทุกอย่างด้วย ToastProvider ตัวเดียว — แยกเป็นหลาย island
 * ไม่ได้เพราะ React context ข้าม island กันไม่ได้ (บทเรียนจาก AdminDashboard)
 */
import { useState } from "react";
import { ToastProvider, useToast } from "../ToastProvider";
import GeneratorForm, { type GeneratedResult } from "./GeneratorForm";
import PublishPanel from "./PublishPanel";
import TopicalMapPicker from "./TopicalMapPicker";
import PostPicker from "./PostPicker";
import { fetchPost, type EditablePost } from "./api";
import type { TopicalMapRow } from "@/lib/blogwriter/topicalMap";

function BlogWriterInner() {
  const toast = useToast();
  const [pickedRow, setPickedRow] = useState<TopicalMapRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [postPickerOpen, setPostPickerOpen] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [editingPost, setEditingPost] = useState<EditablePost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  async function openForEdit(slug: string) {
    setPostPickerOpen(false);
    setLoadingPost(true);
    try {
      const post = await fetchPost(slug);
      const fm = post.frontmatter as Record<string, string | string[] | undefined>;
      setEditingPost(post);
      setPickedRow(null);
      // สังเคราะห์ result ให้ PublishPanel แสดง — ไม่ต้อง Generate ใหม่
      setResult({
        article: {
          title: String(fm.title ?? ""),
          metaDescription: String(fm.description ?? ""),
          content: "",
        },
        markdown: post.body,
        clusterKeywords: Array.isArray(fm.secondaryKeywords) ? fm.secondaryKeywords.join(", ") : "",
        focusKeyword: String(fm.primaryKeyword ?? ""),
        serpData: null,
      });
      toast.success(`โหลดบทความ "${fm.title ?? slug}" มาแก้ไขแล้ว — เลื่อนลงไปที่ส่วนบันทึก`);
    } catch (e) {
      toast.error(`โหลดบทความไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setLoadingPost(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-4 flex-wrap">
        <div>
          <p className="font-semibold text-slate-100">เริ่มจากแผน Topical Map (150 บท)</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {editingPost
              ? `✏️ กำลังแก้ไข: /blog/${editingPost.slug}`
              : pickedRow
                ? `เลือกไว้: ${pickedRow.title || pickedRow.primaryKeyword} (${pickedRow.status || "ไม่มีสถานะ"})`
                : "เลือกหัวข้อเพื่อเติม keyword, slug, cluster และ FAQ ให้อัตโนมัติ"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPostPickerOpen(true)}
            disabled={loadingPost}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {loadingPost ? "⏳ กำลังโหลด..." : "✏️ แก้ไขบทความเก่า"}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            🗺️ เลือกหัวข้อ
          </button>
        </div>
      </div>

      {pickerOpen && (
        <TopicalMapPicker
          onPick={(row) => {
            setPickedRow(row);
            setEditingPost(null);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {postPickerOpen && (
        <PostPicker onPick={openForEdit} onClose={() => setPostPickerOpen(false)} />
      )}

      {/* โหมดแก้ไขไม่บังคับ Generate ใหม่ — ซ่อนฟอร์มเมื่อกำลังแก้บทเก่า
          เพื่อไม่ให้สับสน (กด Generate เมื่อไรจะกลับสู่โหมดเขียนใหม่) */}
      {!editingPost && <GeneratorForm pickedRow={pickedRow} onGenerated={(r) => { setEditingPost(null); setResult(r); }} />}
      {editingPost && (
        <button
          type="button"
          onClick={() => { setEditingPost(null); setResult(null); }}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← ออกจากโหมดแก้ไข กลับไปเขียนบทความใหม่
        </button>
      )}

      {result && <PublishPanel result={result} pickedRow={pickedRow} existingPost={editingPost} />}
    </div>
  );
}

export default function BlogWriter() {
  return (
    <ToastProvider>
      <BlogWriterInner />
    </ToastProvider>
  );
}
