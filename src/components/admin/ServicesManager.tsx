"use client";

import { useState } from "react";
import { Save, AlertCircle, CheckCircle2, Sliders, Calculator, MessageSquare } from "lucide-react";
import { useToast } from "./ToastProvider";
import PageSeoForm from "./PageSeoForm";

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

interface ServicesManagerProps {
  initialSeoPage: SeoPage;
  processModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
  estimatorModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
  testimonialsModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
}

export default function ServicesManager({
  initialSeoPage,
  processModule,
  estimatorModule,
  testimonialsModule,
}: ServicesManagerProps) {
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [processTitle, setProcessTitle] = useState(processModule.title);
  const [processSubtitle, setProcessSubtitle] = useState(processModule.subtitle || "");
  const [showEstimator, setShowEstimator] = useState(estimatorModule.content?.showOnServices || false);
  const [showTestimonials, setShowTestimonials] = useState(testimonialsModule.content?.showOnServices || false);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    try {
      // 1. Save process module header info
      const resProcess = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "process",
          title: processTitle,
          subtitle: processSubtitle,
          content: processModule.content,
        }),
      });

      if (!resProcess.ok) throw new Error("ล้มเหลวในการบันทึกหัวข้อหน้าขั้นตอนบริการ");

      // 2. Save estimator visibility
      const resEstimator = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "estimator",
          title: estimatorModule.title,
          subtitle: estimatorModule.subtitle,
          content: {
            ...estimatorModule.content,
            showOnServices: showEstimator,
          },
        }),
      });

      if (!resEstimator.ok) throw new Error("ล้มเหลวในการบันทึกค่าการแสดงผลเครื่องคำนวณราคา");

      // 3. Save testimonials visibility
      const resTestimonials = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "testimonials",
          title: testimonialsModule.title,
          subtitle: testimonialsModule.subtitle,
          content: {
            ...testimonialsModule.content,
            showOnServices: showTestimonials,
          },
        }),
      });

      if (!resTestimonials.ok) throw new Error("ล้มเหลวในการบันทึกค่าการแสดงผลรีวิวลูกค้า");

      setStatus("success");
      toast.success("บันทึกข้อมูลหน้าขั้นตอนบริการเรียบร้อยแล้ว");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
  };

  const handleSaveSeo = async (updatedSeo: SeoPage) => {
    const res = await fetch(`/api/seo/${updatedSeo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSeo),
    });
    if (!res.ok) {
      throw new Error("ล้มเหลวในการบันทึกข้อมูล SEO");
    }
    toast.success("บันทึกการตั้งค่า SEO หน้าขั้นตอนบริการเรียบร้อยแล้ว");
  };

  return (
    <div className="space-y-8 font-body">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการหน้าขั้นตอนบริการ</h1>
        <p className="text-xs text-on-surface-variant">
          ปรับแต่งข้อความหัวข้อการบริการ กำหนดการแสดงผลเครื่องมือเสริม และตั้งค่า SEO สำหรับหน้าขั้นตอนบริการ
        </p>
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex border-b border-outline-variant/15">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "content"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🛠️ จัดการเนื้อหาหน้าเพจ
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🔍 ตั้งค่า SEO หน้าบริการ
        </button>
      </div>

      {activeTab === "seo" ? (
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm">
          <PageSeoForm seoPage={initialSeoPage} onSave={handleSaveSeo} />
        </div>
      ) : (
        <form onSubmit={handleSaveContent} className="space-y-6">
          {status === "success" && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-primary">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>บันทึกเนื้อหาสำเร็จเรียบร้อย!</span>
            </div>
          )}

          {status === "error" && (
            <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Services Page Hero Header Text */}
          <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
            <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              ข้อความส่วนหัวของหน้าเพจ (Hero section)
            </h3>
            <p className="text-[10px] text-on-surface-variant/70">
              ข้อความพาดหัวหลักและคำอธิบายที่จะปรากฏด้านบนสุดของหน้า `/services` เพื่อแนะนำขั้นตอนบริการติดตั้งฟิล์ม
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">หัวข้อหลักของหน้า (Page Title) *</label>
                <input
                  type="text"
                  required
                  value={processTitle}
                  onChange={(e) => setProcessTitle(e.target.value)}
                  disabled={status === "saving"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-wider">คำอธิบายเพิ่มเติมหรือหัวข้อย่อย (Page Subtitle)</label>
                <input
                  type="text"
                  value={processSubtitle}
                  onChange={(e) => setProcessSubtitle(e.target.value)}
                  disabled={status === "saving"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>
            </div>
          </div>

          {/* 2. Shared Tools visibility on Services page */}
          <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
            <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
              🖥️ การแสดงผลเครื่องมือและส่วนกลาง (Page Elements Visibility)
            </h3>
            <p className="text-[10px] text-on-surface-variant/70">
              เลือกว่าต้องการนำเครื่องมือคำนวณและข้อความรีวิวของลูกค้ามาประกอบแสดงผลที่ส่วนล่างของหน้าขั้นตอนบริการหรือไม่
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs font-bold text-on-surface-variant">
              {/* Show Estimator */}
              <label className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5 cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={showEstimator}
                  onChange={(e) => setShowEstimator(e.target.checked)}
                  disabled={status === "saving"}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5 mt-0.5 shrink-0"
                />
                <div>
                  <span className="block font-headline font-bold text-on-surface flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-primary" />
                    เครื่องคำนวณราคาประเมิน (Price Estimator)
                  </span>
                  <span className="block text-[10px] font-light text-on-surface-variant/60 mt-1 leading-normal">
                    แสดงสูตรช่วยประเมินค่าใช้จ่ายเบื้องต้นตามตารางเมตรที่ส่วนท้ายของหน้าบริการ
                  </span>
                </div>
              </label>

              {/* Show Testimonials */}
              <label className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5 cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={showTestimonials}
                  onChange={(e) => setShowTestimonials(e.target.checked)}
                  disabled={status === "saving"}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5 mt-0.5 shrink-0"
                />
                <div>
                  <span className="block font-headline font-bold text-on-surface flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    ความคิดเห็นและรีวิวลูกค้า (Testimonials)
                  </span>
                  <span className="block text-[10px] font-light text-on-surface-variant/60 mt-1 leading-normal">
                    ดึงรายการความคิดเห็นคะแนนโหวต 5 ดาวของลูกค้าจริงมาแสดงเพื่อยืนยันมาตรฐานความเชื่อมั่น
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "saving"}
              className="bg-primary text-on-primary px-6 py-3.5 rounded-xl font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {status === "saving" ? "กำลังบันทึก..." : "บันทึกการตั้งค่าหน้าบริการ"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
