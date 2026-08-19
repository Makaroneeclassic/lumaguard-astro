"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { getTrafficSourceData } from "@/lib/utmTracker";

/**
 * tone="sky" ใช้เมื่อวางฟอร์มต่อจากกล่อง CTA ในบทความ เพื่อให้โทนสีต่อเนื่องกัน
 * ค่าเริ่มต้นคงสีเดิมไว้ เพราะฟอร์มนี้ถูกใช้ในอีกสามหน้าที่พื้นหลังต่างกัน
 */
interface LeadFormProps {
  tone?: "default" | "sky";
}

export default function LeadForm({ tone = "default" }: LeadFormProps) {
  const sky = tone === "sky";

  const shellClass = sky
    ? "bg-sky-50/70 p-6 sm:p-8 md:p-10 rounded-2xl border border-sky-200 relative overflow-hidden max-w-4xl mx-auto"
    : "bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-12 rounded-3xl border border-slate-200/80 shadow-xl relative overflow-hidden max-w-4xl mx-auto";

  // บนพื้นฟ้า ช่องกรอกต้องเป็นสีขาวถึงจะแยกออกจากพื้นหลัง
  const fieldClass = sky
    ? "w-full bg-white text-slate-900 border border-sky-200 rounded-xl px-4 sm:px-5 py-3.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all disabled:opacity-50 text-sm"
    : "w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 rounded-xl px-4 sm:px-5 py-3.5 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all disabled:opacity-50 text-sm";

  // ปุ่มหลักให้ตรงกับปุ่ม "ขอใบเสนอราคาฟรี" ในกล่อง CTA
  const submitClass = sky
    ? "w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-headline font-bold text-sm sm:text-base transition-all flex justify-center items-center gap-2 disabled:opacity-60"
    : "w-full bg-amber-800 hover:bg-amber-700 text-white py-4 rounded-xl font-headline font-bold text-sm sm:text-base transition-all flex justify-center items-center gap-2 disabled:opacity-60";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    district: "",
    propertyType: "Condo",
    areaSize: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.district) {
      setStatus("error");
      setErrorMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, เบอร์โทร, เขตพื้นที่)");
      return;
    }

    const marketingData = getTrafficSourceData();
    let estimatedArea: number | null = null;
    let recommendedFilm: string | null = null;

    if (typeof window !== "undefined" && window.sessionStorage) {
      const savedArea = window.sessionStorage.getItem("lg_estimated_area");
      if (savedArea) {
        estimatedArea = parseFloat(savedArea);
      }
      recommendedFilm = window.sessionStorage.getItem("lg_recommended_film");
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          areaSize: formData.areaSize ? parseFloat(formData.areaSize) : null,
          estimatedArea,
          recommendedFilm,
          ...marketingData
        }),
      });

      if (!res.ok) {
        throw new Error("ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }

      // GA4 Event Tracking for Lead Submission
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "generate_lead", {
          form_id: "lead_form",
          property_type: formData.propertyType,
          value: 1
        });
      }

      setStatus("success");
      setFormData({
        name: "",
        phone: "",
        district: "",
        propertyType: "Condo",
        areaSize: "",
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "เกิดข้อผิดพลาดบางอย่าง");
    }
  };

  return (
    <div className={shellClass}>
      <h3 className="text-xl sm:text-2xl font-headline font-extrabold mb-6 text-slate-900 dark:text-white tracking-tight text-center md:text-left">
        จองบริการสำรวจวัดขนาดพื้นที่ฟรี
      </h3>

      {status === "success" ? (
        <div className="bg-sky-50 border border-sky-200 p-8 rounded-2xl text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-sky-600 mx-auto" />
          <h4 className="text-lg font-bold font-headline text-slate-900">ส่งคำขอเสร็จสมบูรณ์!</h4>
          <p className="text-slate-600 text-sm font-light">
            ขอบคุณสำหรับความสนใจ เจ้าหน้าที่ผู้เชี่ยวชาญจะติดต่อกลับเพื่อประเมินราคาและยืนยันนัดหมายทางโทรศัพท์โดยเร็วที่สุด
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold font-headline text-sm hover:bg-sky-700 transition-colors shadow-sm"
          >
            ส่งคำขอใหม่
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === "error" && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label htmlFor="lead-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                ชื่อ-นามสกุล *
              </label>
              <input
                type="text"
                required
                id="lead-name"
                autoComplete="name"
                placeholder="ระบุชื่อของคุณ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                เบอร์โทรศัพท์ติดต่อ *
              </label>
              <input
                type="tel"
                required
                id="lead-phone"
                autoComplete="tel"
                placeholder="08X-XXX-XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-district" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                เขต / อำเภอ (ที่ตั้งอาคาร) *
              </label>
              <input
                type="text"
                required
                id="lead-district"
                autoComplete="address-level2"
                placeholder="เช่น วัฒนา, บางนา"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-property-type" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                ประเภทสิ่งปลูกสร้าง
              </label>
              <select
                id="lead-property-type"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              >
                <option value="Condo">คอนโดมิเนียม</option>
                <option value="House">บ้านเดี่ยว / ทาวน์โฮม</option>
                <option value="Office">สำนักงาน / ออฟฟิศ</option>
                <option value="Commercial">ร้านค้า / อาคารพาณิชย์</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-area-size" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                พื้นที่กระจกโดยประมาณ (ตร.ม.)
              </label>
              <input
                type="number"
                id="lead-area-size"
                placeholder="เช่น 30, 150"
                value={formData.areaSize}
                onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className={submitClass}
            >
              {status === "submitting" ? "กำลังประมวลผล..." : "ส่งข้อมูลและขอนัดหมายสำรวจพื้นที่"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
