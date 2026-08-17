"use client";

import { useState, type FormEvent } from "react";
import { Save, AlertCircle, CheckCircle2, ShieldCheck, Thermometer, Eye, HelpCircle, Layers, Image as ImageIcon } from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";
import { useToast } from "./ToastProvider";
import PageSeoForm from "./PageSeoForm";

interface HomepageModule {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  content: any; // JSON
  isActive: boolean;
}

interface HomepageEditorProps {
  initialModules: HomepageModule[];
  initialSeoPage: any;
}

export default function HomepageEditor({ initialModules, initialSeoPage }: HomepageEditorProps) {
  const [activeTab, setActiveTab] = useState<"modules" | "seo">("modules");
  const [modules, setModules] = useState<HomepageModule[]>(initialModules);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const toast = useToast();

  const handleSaveSeo = async (updatedSeo: any) => {
    const res = await fetch(`/api/seo/${updatedSeo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSeo),
    });
    if (!res.ok) {
      throw new Error("ล้มเหลวในการบันทึกข้อมูล SEO");
    }
    toast.success("บันทึกการตั้งค่า SEO หน้าแรกเรียบร้อยแล้ว");
  };


  const currentModule = modules[selectedModuleIndex];

  const handleFieldChange = (field: keyof HomepageModule, value: any) => {
    setModules((prev) =>
      prev.map((m, idx) => (idx === selectedModuleIndex ? { ...m, [field]: value } : m))
    );
  };

  const handleContentFieldChange = (nestedKey: string, value: any) => {
    if (!currentModule) return;
    const updatedContent = { ...(currentModule.content || {}) };
    updatedContent[nestedKey] = value;
    handleFieldChange("content", updatedContent);
  };

  const handleNestedArrayChange = (arrayName: string, index: number, field: string, value: any) => {
    if (!currentModule || !currentModule.content || !currentModule.content[arrayName]) return;
    const updatedArray = [...currentModule.content[arrayName]];
    updatedArray[index] = { ...updatedArray[index], [field]: value };
    handleContentFieldChange(arrayName, updatedArray);
  };

  const [savingStructure, setSavingStructure] = useState(false);

  const toggleModuleActiveLocal = (index: number) => {
    setModules((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, isActive: !m.isActive } : m))
    );
  };

  const moveModuleUp = (index: number) => {
    if (index === 0) return;
    setModules((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
    if (selectedModuleIndex === index) {
      setSelectedModuleIndex(index - 1);
    } else if (selectedModuleIndex === index - 1) {
      setSelectedModuleIndex(index);
    }
  };

  const moveModuleDown = (index: number) => {
    if (index === modules.length - 1) return;
    setModules((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
    if (selectedModuleIndex === index) {
      setSelectedModuleIndex(index + 1);
    } else if (selectedModuleIndex === index + 1) {
      setSelectedModuleIndex(index);
    }
  };

  const handleSaveStructure = async () => {
    setSavingStructure(true);
    try {
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const res = await fetch(`/api/admin/homepage`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: m.key,
            title: m.title,
            subtitle: m.subtitle,
            content: m.content,
            isActive: m.isActive,
            sortOrder: i,
          }),
        });
        if (!res.ok) {
          throw new Error(`ล้มเหลวในการบันทึกโมดูล ${m.key}`);
        }
      }
      toast.success("บันทึกโครงสร้างและลำดับโมดูลหน้าแรกเรียบร้อยแล้ว");
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกโครงสร้าง");
    } finally {
      setSavingStructure(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentModule) return;

    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentModule),
      });

      if (!res.ok) {
        throw new Error("ล้มเหลวในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      }

      setStatus("success");
      toast.success("บันทึกเนื้อหาโมดูลสำเร็จ");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      const msg = err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const getModuleDisplayName = (key: string) => {
    switch (key) {
      case "hero": return "1. Hero Banner (บนสุด)";
      case "why-us": return "2. Why US (ทำไมเลือกเรา)";
      case "products": return "3. Product Specs (สเปกฟิล์ม)";
      case "process": return "4. Process (ขั้นตอนบริการ)";
      case "estimator": return "5. Price Estimator (คำนวณราคา)";
      case "testimonials": return "6. Testimonials (ลูกค้า)";
      case "contact": return "7. Contact Section (ติดต่อ)";
      case "consultation": return "8. Consultation (วิเคราะห์ฟิล์ม)";
      case "blogs": return "9. Articles (บทความล่าสุด)";
      case "faq": return "10. FAQ (คำถามพบบ่อย)";
      default: return key;
    }
  };

  return (
    <div className="space-y-8 font-body">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการหน้าแรก</h1>
        <p className="text-xs text-on-surface-variant">
          ปรับแต่งข้อความ รูปภาพ เนื้อหาของแต่ละโมดูลหน้าแรก จัดลำดับ Layout การแสดงผล และตั้งค่า SEO
        </p>
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex border-b border-outline-variant/15">
        <button
          onClick={() => setActiveTab("modules")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "modules"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🎛️ จัดการโครงสร้างและเนื้อหาโมดูล
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🔍 ตั้งค่า SEO หน้าแรก
        </button>
      </div>

      {activeTab === "seo" ? (
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm">
          {initialSeoPage ? (
            <PageSeoForm seoPage={initialSeoPage} onSave={handleSaveSeo} />
          ) : (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              ไม่พบข้อมูลการตั้งค่า SEO ของหน้าแรกในระบบ
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Modules select and quick toggle */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 space-y-4">
          <h3 className="font-headline font-bold text-sm uppercase tracking-wider text-on-surface-variant">
            โครงสร้างและสถานะโมดูล
          </h3>
          <div className="flex flex-col gap-2">
            {modules.map((m, idx) => (
              <div
                key={m.key}
                onClick={() => {
                  setSelectedModuleIndex(idx);
                  setStatus("idle");
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  idx === selectedModuleIndex
                    ? "bg-primary text-white"
                    : "hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <div className="flex flex-col text-left min-w-0 pr-2">
                  <span className="text-xs font-headline font-bold truncate">
                    {getModuleDisplayName(m.key)}
                  </span>
                  <span className={`text-[10px] ${idx === selectedModuleIndex ? "text-white/70" : "text-on-surface-variant/60"}`}>
                    คีย์: {m.key}
                  </span>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveModuleUp(idx)}
                    className={`p-1 rounded text-xs disabled:opacity-20 cursor-pointer hover:bg-black/10 ${
                      idx === selectedModuleIndex ? "hover:bg-white/20 text-white" : "text-on-surface-variant"
                    }`}
                    title="เลื่อนขึ้น"
                  >
                    ▲
                  </button>
                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={idx === modules.length - 1}
                    onClick={() => moveModuleDown(idx)}
                    className={`p-1 rounded text-xs disabled:opacity-20 cursor-pointer hover:bg-black/10 ${
                      idx === selectedModuleIndex ? "hover:bg-white/20 text-white" : "text-on-surface-variant"
                    }`}
                    title="เลื่อนลง"
                  >
                    ▼
                  </button>

                  {/* Quick Toggle Switch */}
                  <div 
                    className="flex items-center ml-1" 
                    onClick={() => toggleModuleActiveLocal(idx)}
                  >
                    <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      m.isActive ? "bg-tertiary-container" : "bg-outline-variant/35"
                    }`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        m.isActive ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Save list structure button */}
            <button
              type="button"
              disabled={savingStructure}
              onClick={handleSaveStructure}
              className="w-full mt-4 bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4.5 h-4.5" />
              <span>{savingStructure ? "กำลังบันทึก..." : "บันทึกโครงสร้าง & ลำดับ"}</span>
            </button>
          </div>
        </div>

        {/* Right Editor Form */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm">
          {!currentModule ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              กรุณาเลือกโมดูลเพื่อเริ่มต้นแก้ไข
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-outline-variant/10 gap-4">
                <div>
                  <h3 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    แก้ไขข้อมูล: {getModuleDisplayName(currentModule.key).split(" ").slice(1).join(" ")}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant/70 mt-1">
                    การแก้ไขข้อความข้างล่างนี้จะส่งผลเมื่อเปิดสวิตช์ใช้งานโมดูลนี้
                  </p>
                </div>
                
                <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/5">
                  <span className="text-xs font-bold text-on-surface-variant">สถานะบนหน้าแรก:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentModule.isActive}
                      onChange={() => toggleModuleActiveLocal(selectedModuleIndex)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-outline-variant/35 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-2 text-xs font-bold text-on-surface">
                      {currentModule.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </label>
                </div>
              </div>

              {status === "success" && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-primary">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>บันทึกเนื้อหาโมดูลสำเร็จ! ข้อมูลถูกเผยแพร่ในหน้าแรกอย่างปลอดภัย</span>
                </div>
              )}

              {status === "error" && (
                <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage} (แอดมินสามารถเปิดดูหน้าแรกและทำรายการอื่นต่อได้ปกติ)</span>
                </div>
              )}

              <div className="space-y-6 text-xs font-semibold text-on-surface-variant">
                {/* Standard Module Title */}
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">
                    หัวข้อหลักของโมดูล (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentModule.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    disabled={status === "saving"}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                </div>

                {/* Standard Module Subtitle */}
                {currentModule.key !== "process" && currentModule.key !== "testimonials" && (
                  <div className="space-y-2">
                    <label className="block uppercase tracking-wider">
                      หัวข้อย่อยหรือคำบรรยายย่อย (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={currentModule.subtitle || ""}
                      onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                      disabled={status === "saving"}
                      className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                    />
                  </div>
                )}

                {/* --- MODULE SPECIFIC FIELDS --- */}

                {/* 1. Hero Module specific content */}
                {currentModule.key === "hero" && currentModule.content && (
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">เนื้อหาและปุ่มนำทาง (Hero Content)</h4>
                    
                    <div className="space-y-2">
                      <label className="block uppercase tracking-wider text-[10px]">
                        คำบรรยายหลัก (Hero Description)
                      </label>
                      <textarea
                        rows={3}
                        value={currentModule.content.description || ""}
                        onChange={(e) => handleContentFieldChange("description", e.target.value)}
                        disabled={status === "saving"}
                        className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block uppercase tracking-wider text-[10px]">
                          ข้อความปุ่มหลัก (Primary Button Text)
                        </label>
                        <input
                          type="text"
                          value={currentModule.content.btnTextPrimary || ""}
                          onChange={(e) => handleContentFieldChange("btnTextPrimary", e.target.value)}
                          disabled={status === "saving"}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block uppercase tracking-wider text-[10px]">
                          ลิงก์ปุ่มหลัก (Primary Button Link)
                        </label>
                        <input
                          type="text"
                          value={currentModule.content.btnLinkPrimary || ""}
                          onChange={(e) => handleContentFieldChange("btnLinkPrimary", e.target.value)}
                          disabled={status === "saving"}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block uppercase tracking-wider text-[10px]">
                          ข้อความปุ่มรอง (Secondary Button Text)
                        </label>
                        <input
                          type="text"
                          value={currentModule.content.btnTextSecondary || ""}
                          onChange={(e) => handleContentFieldChange("btnTextSecondary", e.target.value)}
                          disabled={status === "saving"}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block uppercase tracking-wider text-[10px]">
                          ลิงก์ปุ่มรอง (Secondary Button Link)
                        </label>
                        <input
                          type="text"
                          value={currentModule.content.btnLinkSecondary || ""}
                          onChange={(e) => handleContentFieldChange("btnLinkSecondary", e.target.value)}
                          disabled={status === "saving"}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block uppercase tracking-wider text-[10px]">
                        URL รูปภาพพื้นหลัง (Hero Background Image URL)
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={currentModule.content.bgImage || ""}
                          onChange={(e) => handleContentFieldChange("bgImage", e.target.value)}
                          disabled={status === "saving"}
                          className="flex-grow bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                        <button
                          type="button"
                          onClick={() => setMediaOpen(true)}
                          disabled={status === "saving"}
                          className="px-4 py-3 rounded-xl bg-primary-container text-primary font-headline font-bold text-xs hover:opacity-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>คลังรูป</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Why US Module specific content */}
                {currentModule.key === "why-us" && currentModule.content && currentModule.content.features && (
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">รายการจุดขายหลัก 3 ข้อ (Features)</h4>
                    
                    {currentModule.content.features.map((feature: any, idx: number) => (
                      <div key={idx} className="p-6 bg-surface-container-low rounded-2xl space-y-3 border border-outline-variant/5">
                        <div className="flex items-center gap-2 font-bold text-xs text-primary">
                          <span>คุณสมบัติข้อที่ {idx + 1}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block uppercase tracking-wider text-[10px]">ไอคอน (Icon Key)</label>
                            <select
                              value={feature.icon}
                              onChange={(e) => handleNestedArrayChange("features", idx, "icon", e.target.value)}
                              disabled={status === "saving"}
                              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                            >
                              <option value="ShieldCheck">ShieldCheck (เกราะป้องกัน)</option>
                              <option value="Thermometer">Thermometer (อุณหภูมิ)</option>
                              <option value="Eye">Eye (ทัศนวิสัย)</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block uppercase tracking-wider text-[10px]">หัวข้อคุณสมบัติ (Feature Title)</label>
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => handleNestedArrayChange("features", idx, "title", e.target.value)}
                              disabled={status === "saving"}
                              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider text-[10px]">คำบรรยายรายละเอียด (Feature Description)</label>
                          <textarea
                            rows={2}
                            value={feature.description}
                            onChange={(e) => handleNestedArrayChange("features", idx, "description", e.target.value)}
                            disabled={status === "saving"}
                            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Products Module specific content */}
                {currentModule.key === "products" && currentModule.content && (
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">คำอธิบายกลุ่มผลิตภัณฑ์</h4>
                    <div className="space-y-2">
                      <label className="block uppercase tracking-wider text-[10px]">
                        คำบรรยายประกอบตารางเปรียบเทียบ (Products Description)
                      </label>
                      <textarea
                        rows={3}
                        value={currentModule.content.description || ""}
                        onChange={(e) => handleContentFieldChange("description", e.target.value)}
                        disabled={status === "saving"}
                        className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Process Module specific content */}
                {currentModule.key === "process" && currentModule.content && currentModule.content.steps && (
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">ขั้นตอนการติดตั้ง 4 ขั้นตอน (Steps)</h4>
                    
                    {currentModule.content.steps.map((step: any, idx: number) => (
                      <div key={idx} className="p-6 bg-surface-container-low rounded-2xl space-y-3 border border-outline-variant/5">
                        <div className="flex items-center gap-2 font-bold text-xs text-primary">
                          <span>ขั้นตอนที่ {step.stepNo || `0${idx + 1}`}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1 space-y-2">
                            <label className="block uppercase tracking-wider text-[10px]">รหัสขั้นตอน (Step No.)</label>
                            <input
                              type="text"
                              value={step.stepNo}
                              onChange={(e) => handleNestedArrayChange("steps", idx, "stepNo", e.target.value)}
                              disabled={status === "saving"}
                              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                            />
                          </div>

                          <div className="md:col-span-3 space-y-2">
                            <label className="block uppercase tracking-wider text-[10px]">ชื่อขั้นตอน (Step Title)</label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => handleNestedArrayChange("steps", idx, "title", e.target.value)}
                              disabled={status === "saving"}
                              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider text-[10px]">คำอธิบายขั้นตอน (Step Description)</label>
                          <textarea
                            rows={2}
                            value={step.description}
                            onChange={(e) => handleNestedArrayChange("steps", idx, "description", e.target.value)}
                            disabled={status === "saving"}
                            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Estimator - No specific content fields needed */}



                {/* 7. Testimonials - No specific content fields needed */}

                {/* 8. Contact Module specific content */}
                {currentModule.key === "contact" && currentModule.content && (
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">ช่องทางการติดต่อด่วน (Quick Contact Details)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block uppercase tracking-wider text-[10px]">
                          เบอร์โทรศัพท์ติดต่อ (Phone Number)
                        </label>
                        <input
                          type="text"
                          value={currentModule.content.phone || ""}
                          onChange={(e) => handleContentFieldChange("phone", e.target.value)}
                          disabled={status === "saving"}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block uppercase tracking-wider text-[10px]">
                          LINE Official ID (e.g. @LUMAGUARD)
                        </label>
                        <input
                          type="text"
                          value={currentModule.content.line || ""}
                          onChange={(e) => handleContentFieldChange("line", e.target.value)}
                          disabled={status === "saving"}
                          className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. Consultation Module specific content */}
                {currentModule.key === "consultation" && currentModule.content && (
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">เนื้อหาแนะนำเครื่องมือวิเคราะห์ฟิล์ม</h4>
                    <div className="space-y-2">
                      <label className="block uppercase tracking-wider text-[10px]">
                        คำอธิบายรายละเอียด (Consultation Description)
                      </label>
                      <textarea
                        rows={3}
                        value={currentModule.content.description || ""}
                        onChange={(e) => handleContentFieldChange("description", e.target.value)}
                        disabled={status === "saving"}
                        className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                      />
                    </div>
                  </div>
                )}

                {/* 10. Blogs Module specific content */}
                {currentModule.key === "blogs" && currentModule.content && (
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">หัวข้อหมวดหมู่บทความ</h4>
                    <div className="space-y-2">
                      <label className="block uppercase tracking-wider text-[10px]">
                        ข้อความปุ่มลิงก์ (Link Button Text)
                      </label>
                      <input
                        type="text"
                        value={currentModule.content.linkText || ""}
                        onChange={(e) => handleContentFieldChange("linkText", e.target.value)}
                        disabled={status === "saving"}
                        className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                      />
                    </div>
                  </div>
                )}

                {/* 11. FAQ Module specific content */}
                {currentModule.key === "faq" && currentModule.content && currentModule.content.items && (
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-sm text-on-surface">รายการคำถาม-คำตอบ (FAQ Items)</h4>
                    {currentModule.content.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-6 bg-surface-container-low rounded-2xl space-y-3 border border-outline-variant/5">
                        <div className="flex items-center justify-between font-bold text-xs text-primary">
                          <span>รายการคำถามที่ {idx + 1}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider text-[10px]">คำถาม (Question)</label>
                          <input
                            type="text"
                            value={item.q}
                            onChange={(e) => handleNestedArrayChange("items", idx, "q", e.target.value)}
                            disabled={status === "saving"}
                            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider text-[10px]">คำตอบ (Answer)</label>
                          <textarea
                            rows={3}
                            value={item.a}
                            onChange={(e) => handleNestedArrayChange("items", idx, "a", e.target.value)}
                            disabled={status === "saving"}
                            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant/10">
                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {status === "saving" ? "กำลังบันทึก..." : `บันทึกข้อมูลโมดูล ${getModuleDisplayName(currentModule.key).split(" ").slice(1).join(" ")}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      )}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => handleContentFieldChange("bgImage", url)}
        title="เลือกรูปภาพพื้นหลัง Banner"
      />
    </div>
  );
}

