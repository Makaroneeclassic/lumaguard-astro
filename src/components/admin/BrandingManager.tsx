"use client";

import { useState } from "react";
import { Save, AlertCircle, CheckCircle2, Palette, ShieldAlert } from "lucide-react";
import { useToast } from "./ToastProvider";
import MediaLibraryModal from "./MediaLibraryModal";

interface SeoGlobal {
  id: string;
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string | null;
  googleVerificationCode: string | null;
  googleAnalyticsId: string | null;
  robotsTxtDirectives: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  businessAddress: string | null;
  businessPhone: string | null;
  businessPriceRange: string | null;
  businessMapUri: string | null;
}

interface BrandingManagerProps {
  globalSettings: SeoGlobal;
}

export default function BrandingManager({ globalSettings }: BrandingManagerProps) {
  const [settings, setSettings] = useState<SeoGlobal>(globalSettings);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const toast = useToast();

  const handleInputChange = (field: keyof SeoGlobal, value: string | null) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const res = await fetch(`/api/seo/global`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("ล้มเหลวในการบันทึกค่าตั้งค่าระบบ");
      }

      setStatus("success");
      toast.success("บันทึกข้อมูลอัตลักษณ์แบรนด์ & ค่าระบบสำเร็จ!");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="space-y-8 font-body">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">ตั้งค่าแบรนด์ & ระบบทั่วไป</h1>
        <p className="text-xs text-on-surface-variant">
          ปรับปรุงโทนสีของแบรนด์ ฟอนต์ตัวอักษรของระบบ รหัสการตลาดสำหรับ Google และการตั้งค่าพื้นฐานของเว็บไซต์
        </p>
      </div>

      {status === "success" && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-primary">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>บันทึกการตั้งค่าแบรนด์และระบบทั่วไปสำเร็จเรียบร้อย!</span>
        </div>
      )}

      {status === "error" && (
        <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold text-on-surface-variant">
        
        {/* 1. Identity & Colors */}
        <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
          <div className="border-b border-outline-variant/10 pb-4">
            <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
              <Palette className="w-5 h-5" />
              การจัดการชุดสีอัตลักษณ์แบรนด์ (Brand Custom Theme Colors)
            </h3>
            <p className="text-[10px] text-on-surface-variant/70 mt-1">
              ปรับแต่งเฉดสี โทนสีปุ่ม สีตัวอักษร และรายละเอียดสีแบรนด์ดิ้งทั้งหมดของระบบ พร้อมเครื่องมือดูดสี (Eyedropper) วงกลมสีกดเลือกด่วน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* สีหลัก */}
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/5 space-y-3">
              <label className="block uppercase tracking-wider text-xs font-bold text-on-surface">สีหลักประจำแบรนด์ (Primary Brand Color)</label>
              <p className="text-[9px] text-on-surface-variant/60 font-light">ใช้แสดงเน้นหัวข้อหลัก ขอบกรอบตกแต่ง และจุดดึงดูดสายตาหลัก</p>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  className="w-12 h-11 bg-white border border-outline-variant/20 rounded-xl cursor-pointer p-1 shrink-0"
                  title="ดูดสี / จิ้มสี"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  className="flex-grow bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface font-mono font-normal"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["#004692", "#0f172a", "#743800", "#ba1a1a", "#006a6a", "#4f6169"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleInputChange("primaryColor", c)}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* สีรอง */}
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/5 space-y-3">
              <label className="block uppercase tracking-wider text-xs font-bold text-on-surface">สีรองของแบรนด์ (Secondary Brand Color)</label>
              <p className="text-[9px] text-on-surface-variant/60 font-light">ใช้แสดงการไล่ระดับน้ำหนักของการออกแบบ การ์ดข้อมูล และสเปกย่อย</p>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                  className="w-12 h-11 bg-white border border-outline-variant/20 rounded-xl cursor-pointer p-1 shrink-0"
                  title="ดูดสี / จิ้มสี"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                  className="flex-grow bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface font-mono font-normal"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["#4f6169", "#0284c7", "#d2e6ef", "#e1e3e4", "#5c6370", "#191c1d"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleInputChange("secondaryColor", c)}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* สีข้อความ / ฟอนต์ทั่วไป */}
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/5 space-y-3">
              <label className="block uppercase tracking-wider text-xs font-bold text-on-surface">สีฟอนต์ / ข้อความทั่วไป (Body Text Color)</label>
              <p className="text-[9px] text-on-surface-variant/60 font-light">ใช้กำหนดสีตัวหนังสือหลักที่อ่านง่าย ไม่ปวดตาบนพื้นหลังขาว/เทา</p>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => handleInputChange("textColor", e.target.value)}
                  className="w-12 h-11 bg-white border border-outline-variant/20 rounded-xl cursor-pointer p-1 shrink-0"
                  title="ดูดสี / จิ้มสี"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => handleInputChange("textColor", e.target.value)}
                  className="flex-grow bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface font-mono font-normal"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["#191c1d", "#1e293b", "#424752", "#000000", "#4b5563"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleInputChange("textColor", c)}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* สีปุ่มหลัก */}
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/5 space-y-3">
              <label className="block uppercase tracking-wider text-xs font-bold text-on-surface">สีปุ่มกดหลัก (Primary Button Color)</label>
              <p className="text-[9px] text-on-surface-variant/60 font-light">สีของปุ่มหลัก (CTA Buttons) บนหน้าเว็บ เช่น ปุ่มเลือกสินค้า ปุ่มประเมินราคา</p>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.buttonColor}
                  onChange={(e) => handleInputChange("buttonColor", e.target.value)}
                  className="w-12 h-11 bg-white border border-outline-variant/20 rounded-xl cursor-pointer p-1 shrink-0"
                  title="ดูดสี / จิ้มสี"
                />
                <input
                  type="text"
                  value={settings.buttonColor}
                  onChange={(e) => handleInputChange("buttonColor", e.target.value)}
                  className="flex-grow bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface font-mono font-normal"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["#004692", "#0f172a", "#743800", "#ba1a1a", "#0284c7", "#000000"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleInputChange("buttonColor", c)}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* สีข้อความบนปุ่ม */}
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/5 space-y-3">
              <label className="block uppercase tracking-wider text-xs font-bold text-on-surface">สีฟอนต์บนปุ่ม (Button Text Color)</label>
              <p className="text-[9px] text-on-surface-variant/60 font-light">สีของตัวหนังสือข้างในปุ่มกดหลัก เพื่อความชัดเจนในการอ่านข้อความปุ่ม</p>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.buttonTextColor}
                  onChange={(e) => handleInputChange("buttonTextColor", e.target.value)}
                  className="w-12 h-11 bg-white border border-outline-variant/20 rounded-xl cursor-pointer p-1 shrink-0"
                  title="ดูดสี / จิ้มสี"
                />
                <input
                  type="text"
                  value={settings.buttonTextColor}
                  onChange={(e) => handleInputChange("buttonTextColor", e.target.value)}
                  className="flex-grow bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface font-mono font-normal"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["#ffffff", "#f8f9fa", "#1e293b", "#000000"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleInputChange("buttonTextColor", c)}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* ฟอนต์ Google Font */}
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <label className="block uppercase tracking-wider text-xs font-bold text-on-surface">ฟอนต์แสดงผลเว็บไซต์ (Google Font Family)</label>
                <p className="text-[9px] text-on-surface-variant/60 font-light">ฟอนต์มาตรฐานสากลที่จะโหลดมาแสดงผลกับหน้าบ้านทั้งหมด</p>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => handleInputChange("fontFamily", e.target.value)}
                  className="w-full bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                >
                  <option value="Noto Sans Thai">Noto Sans Thai (แนะนำ/มาตรฐานสากล)</option>
                  <option value="Prompt">Prompt</option>
                  <option value="Sarabun">Sarabun (ทางการ)</option>
                  <option value="Kanit">Kanit (สปอร์ต/สมัยใหม่)</option>
                  <option value="Inter">Inter (อินเตอร์/สะอาด)</option>
                  <option value="Anuphan">Anuphan (วัยรุ่น/มินิมอล)</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* 2. Site global metadata defaults */}
        <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-5">
          <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
            🌐 การตั้งค่าเว็บไซต์พื้นฐาน (Website Global SEO Defaults)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block uppercase tracking-wider">ชื่อแบรนด์เว็บไซต์ (Site Name) *</label>
              <input
                type="text"
                required
                value={settings.siteName}
                onChange={(e) => handleInputChange("siteName", e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
              />
            </div>

            <div className="space-y-2">
              <label className="block uppercase tracking-wider">รูปแบบชื่อหัวข้อหน้าเว็บ (Title Template) *</label>
              <input
                type="text"
                required
                value={settings.titleTemplate}
                onChange={(e) => handleInputChange("titleTemplate", e.target.value)}
                placeholder="%s | LUMAGUARD"
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block uppercase tracking-wider">คำอธิบายภาพรวมเริ่มต้นของร้าน (Default Description) *</label>
            <textarea
              required
              rows={3}
              value={settings.defaultDescription}
              onChange={(e) => handleInputChange("defaultDescription", e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="block uppercase tracking-wider">รูปภาพสำหรับการแชร์หน้าแรก (Default OG Image)</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={settings.defaultOgImage || ""}
                onChange={(e) => handleInputChange("defaultOgImage", e.target.value)}
                placeholder="เลือกรูปสำหรับหน้าแรกและหน้าทั่วไป..."
                className="flex-grow bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
              />
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="px-4 py-3 rounded-xl bg-primary-container text-primary font-headline font-bold text-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
              >
                คลังรูปภาพ
              </button>
            </div>
          </div>
        </div>

        {/* 3. Marketing & Google Verification */}
        <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-5">
          <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
            📊 ระบบติดตามสถิติและการตลาด (Marketing Verification & GA4)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block uppercase tracking-wider">รหัสสถิติ Google Analytics ID (Measurement ID)</label>
              <input
                type="text"
                value={settings.googleAnalyticsId || ""}
                onChange={(e) => handleInputChange("googleAnalyticsId", e.target.value)}
                placeholder="e.g. G-XXXXXXXXXX"
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block uppercase tracking-wider">รหัสยืนยัน Google Search Console (Verification Code)</label>
              <input
                type="text"
                value={settings.googleVerificationCode || ""}
                onChange={(e) => handleInputChange("googleVerificationCode", e.target.value)}
                placeholder="ก๊อปปี้ Content จาก google-site-verification HTML Meta tag"
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block uppercase tracking-wider">กฎบอทสืบค้นเว็บไซต์ (Robots.txt Directives)</label>
            <textarea
              rows={3}
              value={settings.robotsTxtDirectives || ""}
              onChange={(e) => handleInputChange("robotsTxtDirectives", e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light font-mono leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-primary text-on-primary px-6 py-3.5 rounded-xl font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "กำลังบันทึก..." : "บันทึกการตั้งค่าระบบและแบรนด์"}
          </button>
        </div>
      </form>

      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          handleInputChange("defaultOgImage", url);
          setMediaOpen(false);
        }}
        title="เลือกรูปภาพสำหรับการแชร์หลัก"
      />
    </div>
  );
}
