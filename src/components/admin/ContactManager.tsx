"use client";

import { useState } from "react";
import { Save, AlertCircle, CheckCircle2, Phone, MapPin, Map, Calculator, Link } from "lucide-react";
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

interface SeoGlobal {
  id: string;
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessPriceRange: string | null;
  businessMapUri: string | null;
}

interface ContactManagerProps {
  initialSeoPage: SeoPage;
  globalSettings: SeoGlobal;
  contactModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
  estimatorModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
}

export default function ContactManager({
  initialSeoPage,
  globalSettings,
  contactModule,
  estimatorModule,
}: ContactManagerProps) {
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  
  // Contact info (global settings)
  const [phone, setPhone] = useState(globalSettings.businessPhone || "");
  const [address, setAddress] = useState(globalSettings.businessAddress || "");
  const [mapUri, setMapUri] = useState(globalSettings.businessMapUri || "");
  const [priceRange, setPriceRange] = useState(globalSettings.businessPriceRange || "฿฿");

  // Contact page modules info
  const [contactTitle, setContactTitle] = useState(contactModule.title);
  const [contactSubtitle, setContactSubtitle] = useState(contactModule.subtitle || "");
  const [showEstimator, setShowEstimator] = useState(estimatorModule.content?.showOnContact || false);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    try {
      // 1. Save global contact info (requires updating global settings database)
      const resGlobal = await fetch(`/api/seo/global`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...globalSettings,
          businessPhone: phone,
          businessAddress: address,
          businessMapUri: mapUri,
          businessPriceRange: priceRange,
        }),
      });

      if (!resGlobal.ok) throw new Error("ล้มเหลวในการบันทึกข้อมูลติดต่อแบรนด์");

      // 2. Save contact module text
      const resContactMod = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "contact",
          title: contactTitle,
          subtitle: contactSubtitle,
          content: contactModule.content,
        }),
      });

      if (!resContactMod.ok) throw new Error("ล้มเหลวในการบันทึกหัวข้อติดต่อกลับ");

      // 3. Save estimator visibility
      const resEstimator = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "estimator",
          title: estimatorModule.title,
          subtitle: estimatorModule.subtitle,
          content: {
            ...estimatorModule.content,
            showOnContact: showEstimator,
          },
        }),
      });

      if (!resEstimator.ok) throw new Error("ล้มเหลวในการบันทึกความเหมาะสมของเครื่องคำนวณราคา");

      setStatus("success");
      toast.success("บันทึกข้อมูลหน้าติดต่อเราเรียบร้อยแล้ว");
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
    toast.success("บันทึกการตั้งค่า SEO หน้าติดต่อเราเรียบร้อยแล้ว");
  };

  return (
    <div className="space-y-8 font-body">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการหน้าติดต่อเรา</h1>
        <p className="text-xs text-on-surface-variant">
          ปรับปรุงข้อมูลติดต่อบริษัท แผนที่ พิกัด และจัดการคำร้องขอ/ตั้งค่า SEO สำหรับหน้าติดต่อกลับ
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
          📞 ข้อมูลติดต่อ & เนื้อหาหน้า
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🔍 ตั้งค่า SEO หน้าติดต่อเรา
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
              <span>บันทึกเนื้อหาหน้าติดต่อกลับสำเร็จ!</span>
            </div>
          )}

          {status === "error" && (
            <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Global Brand Contact Information */}
          <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
            <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
              <Phone className="w-5 h-5" />
              ข้อมูลติดต่อแบรนด์หลัก (Brand Contact Details)
            </h3>
            <p className="text-[10px] text-on-surface-variant/70">
              รายละเอียดเบอร์โทรศัพท์ร้านและที่อยู่จริงสำหรับนำไปแสดงในหน้ารวมติดต่อกลับ และเป็นโครงสร้าง Schema SEO LocalBusiness บังคับ
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">เบอร์โทรศัพท์ติดต่อร้าน *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={status === "saving"}
                  placeholder="e.g. 02-XXX-XXXX"
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-wider">ระดับราคาบริการทั่วไป (Price Range)</label>
                <input
                  type="text"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  disabled={status === "saving"}
                  placeholder="e.g. ฿฿ or ฿฿฿"
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block uppercase tracking-wider">ลิงก์แผนที่ Google Maps (Map Iframe Src URI)</label>
                <input
                  type="text"
                  value={mapUri}
                  onChange={(e) => setMapUri(e.target.value)}
                  disabled={status === "saving"}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light font-mono"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block uppercase tracking-wider">ที่ตั้งสำนักงานใหญ่/หน้าร้าน (Address) *</label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={status === "saving"}
                  placeholder="กรอกที่อยู่แบบเต็มสำหรับส่งพัสดุและออกเอกสาร..."
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 2. Contact page Hero segment */}
          <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
            <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              ข้อความพาดหัวและคำเชิญชวน (Call to Action Banner)
            </h3>
            <p className="text-[10px] text-on-surface-variant/70">
              ข้อความคำถามชักชวนให้ขอประเมินราคาหรือฝากคำขอเพื่อวิเคราะห์รุ่นฟิล์ม
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-on-surface-variant">
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">คำถามเชิญชวนหลัก *</label>
                <input
                  type="text"
                  required
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  disabled={status === "saving"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-wider">คำบรรยายย่อยสนับสนุน</label>
                <input
                  type="text"
                  value={contactSubtitle}
                  onChange={(e) => setContactSubtitle(e.target.value)}
                  disabled={status === "saving"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>
            </div>
          </div>

          {/* 3. Estimator display status */}
          <div className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
            <h3 className="text-base font-headline font-bold text-primary flex items-center gap-2">
              🖥️ การแสดงผลเครื่องคำนวณราคา (Price Estimator Visibility)
            </h3>
            <p className="text-[10px] text-on-surface-variant/70">
              เลือกว่าต้องการนำเครื่องประเมินงบราคาฟิล์มมาติดตั้งเพิ่มเติมที่หน้านี้เพื่ออำนวยความสะดวกให้ผู้ติดต่อหรือไม่
            </p>

            <div className="pt-2 text-xs font-bold text-on-surface-variant">
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
                    แสดงเครื่องคำนวณราคาประเมิน (Price Estimator)
                  </span>
                  <span className="block text-[10px] font-light text-on-surface-variant/60 mt-1 leading-normal">
                    เปิดใช้เพื่อให้ระบบประเมินค่าฟิล์มแบบด่วนแสดงผลแทรกอยู่ก่อนถึงฟอร์มส่งข้อมูลติดต่อกลับหน้างาน
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
              {status === "saving" ? "กำลังบันทึก..." : "บันทึกการตั้งค่าหน้าติดต่อ"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
