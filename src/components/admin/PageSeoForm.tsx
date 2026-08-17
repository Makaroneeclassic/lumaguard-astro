"use client";

import { useState } from "react";
import { Save, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";

interface SeoPage {
  id: string;
  routePath: string;
  pageName: string;
  title: string;
  description: string;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noindex: boolean;
  nofollow: boolean;
}

interface PageSeoFormProps {
  seoPage: SeoPage;
  onSave: (updated: SeoPage) => Promise<void>;
}

export default function PageSeoForm({ seoPage: initialSeo, onSave }: PageSeoFormProps) {
  const [seo, setSeo] = useState<SeoPage>(initialSeo);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);

  const handleInputChange = (field: keyof SeoPage, value: any) => {
    setSeo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      await onSave(seo);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "ล้มเหลวในการบันทึกข้อมูล SEO");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
        <div>
          <h3 className="text-lg font-headline font-bold text-primary">
            🔍 ปรับแต่งการตลาด & SEO ของหน้าเพจ
          </h3>
          <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
            ตั้งค่าชื่อหัวข้อ คำอธิบาย และสเปกเมตาแท็กที่ใช้แสดงผลบน Google Search และหน้าแชร์โซเชียล
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-surface-container-high px-2.5 py-1 rounded-md text-on-surface-variant">
          {seo.routePath}
        </span>
      </div>

      {status === "success" && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-primary">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>บันทึกการตั้งค่า SEO สำเร็จเรียบร้อย!</span>
        </div>
      )}

      {status === "error" && (
        <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold text-on-surface-variant">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block uppercase tracking-wider">หัวข้อของหน้าเว็บ (Meta Title) *</label>
            <input
              type="text"
              required
              value={seo.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={status === "saving"}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
            />
          </div>

          <div className="space-y-2">
            <label className="block uppercase tracking-wider">คีย์เวิร์ดบอทค้นหา (Keywords)</label>
            <input
              type="text"
              value={seo.keywords || ""}
              onChange={(e) => handleInputChange("keywords", e.target.value)}
              disabled={status === "saving"}
              placeholder="คำสำคัญ คั่นด้วยเครื่องหมายจุลภาค ,"
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block uppercase tracking-wider">คำอธิบายหน้าเว็บสั้นๆ (Meta Description) *</label>
          <textarea
            required
            rows={3}
            value={seo.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            disabled={status === "saving"}
            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <label className="block uppercase tracking-wider">Canonical URL</label>
          <input
            type="text"
            value={seo.canonicalUrl || ""}
            onChange={(e) => handleInputChange("canonicalUrl", e.target.value)}
            disabled={status === "saving"}
            placeholder="https://lumaguardthailand.com..."
            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light font-mono"
          />
        </div>

        {/* Social sharing Open Graph info */}
        <div className="p-6 bg-surface-container-low rounded-2xl space-y-4 border border-outline-variant/10">
          <h4 className="font-headline font-bold text-xs text-on-surface">🔗 รูปแบบแชร์ลิงก์โซเชียล (Open Graph Settings)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block uppercase tracking-wider text-[10px]">หัวข้อแสดงเวลาแชร์ (OG Title)</label>
              <input
                type="text"
                value={seo.ogTitle || ""}
                onChange={(e) => handleInputChange("ogTitle", e.target.value)}
                disabled={status === "saving"}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
              />
            </div>

            <div className="space-y-2">
              <label className="block uppercase tracking-wider text-[10px]">รายละเอียดเวลาแชร์ (OG Description)</label>
              <input
                type="text"
                value={seo.ogDescription || ""}
                onChange={(e) => handleInputChange("ogDescription", e.target.value)}
                disabled={status === "saving"}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block uppercase tracking-wider text-[10px]">รูปภาพเฉพาะสำหรับการแชร์ (OG Image URL)</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={seo.ogImage || ""}
                onChange={(e) => handleInputChange("ogImage", e.target.value)}
                disabled={status === "saving"}
                className="flex-grow bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
              />
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                disabled={status === "saving"}
                className="px-4 py-3 rounded-xl bg-primary-container text-primary font-headline font-bold text-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
              >
                คลังรูปภาพ
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8 pt-2">
          <label className="flex items-center gap-2.5 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={seo.noindex}
              onChange={(e) => handleInputChange("noindex", e.target.checked)}
              disabled={status === "saving"}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span>บล็อกบอท Google ไม่ให้เอาหน้าเว็บนี้ไปค้นหา (noindex)</span>
          </label>

          <label className="flex items-center gap-2.5 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={seo.nofollow}
              onChange={(e) => handleInputChange("nofollow", e.target.checked)}
              disabled={status === "saving"}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span>ไม่ต้องส่งต่อคะแนนคะแนนลิงก์ (nofollow)</span>
          </label>
        </div>

        <div className="pt-4 border-t border-outline-variant/10">
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "กำลังบันทึก..." : "บันทึกการตั้งค่า SEO"}
          </button>
        </div>

      </form>

      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          handleInputChange("ogImage", url);
          setMediaOpen(false);
        }}
        title="เลือกรูปภาพสำหรับการแชร์ (OG Image)"
      />
    </div>
  );
}
