"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Sparkles, Loader2, Image as ImageIcon, FolderOpen } from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";
import { useToast } from "./ToastProvider";
import PageSeoForm from "./PageSeoForm";

interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  altText: string;
  seriesUsed: string;
  areaSize: string | null;
  description: string | null;
}

interface PortfolioManagerProps {
  initialSeoPage: any;
}

export default function PortfolioManager({ initialSeoPage }: PortfolioManagerProps) {
  const [activeTab, setActiveTab] = useState<"items" | "seo">("items");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleSaveSeo = async (updatedSeo: any) => {
    const res = await fetch(`/api/seo/${updatedSeo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSeo),
    });
    if (!res.ok) {
      throw new Error("ล้มเหลวในการบันทึกข้อมูล SEO");
    }
    toast.success("บันทึกการตั้งค่า SEO หน้าผลงานติดตั้งเรียบร้อยแล้ว");
  };

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        setPortfolioItems(data);
      } else {
        toast.error("โหลดรายการผลงานไม่สำเร็จ");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem({
      title: "",
      location: "",
      category: "condo",
      image: "",
      altText: "",
      seriesUsed: "Guardian Ceramic 35",
      areaSize: "",
      description: "",
    });
    setIsFormOpen(true);
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบผลงาน "${title}" ใช่หรือไม่?`)) return;
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบผลงานเรียบร้อยแล้ว");
        fetchPortfolio();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "เกิดข้อผิดพลาดในการลบผลงาน");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.location || !editingItem?.category || !editingItem?.image || !editingItem?.seriesUsed) {
      setError("โปรดกรอกฟิลด์ที่จำเป็นให้ครบถ้วน (ชื่อโครงการ, สถานที่, รูปภาพ, รุ่นฟิล์ม)");
      return;
    }

    setSubmitting(true);
    setError("");

    const isEdit = !!editingItem.id;
    const url = isEdit ? `/api/portfolio/${editingItem.id}` : "/api/portfolio";
    const method = isEdit ? "PUT" : "POST";

    const finalItem = {
      ...editingItem,
      altText: editingItem.altText || editingItem.title,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalItem),
      });

      if (res.ok) {
        toast.success(isEdit ? "แก้ไขผลงานสำเร็จแล้ว" : "เพิ่มผลงานสำเร็จแล้ว");
        setIsFormOpen(false);
        setEditingItem(null);
        fetchPortfolio();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PortfolioItem, value: string) => {
    setEditingItem((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 font-body">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการหน้าผลงานติดตั้ง</h1>
          <p className="text-xs text-on-surface-variant">อัปโหลดภาพผลงานจริง ระบุสถานที่ และตั้งค่า SEO สำหรับหน้ารวมผลงาน</p>
        </div>
        {activeTab === "items" && (
          <button
            onClick={handleAddNew}
            className="bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผลงานใหม่</span>
          </button>
        )}
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex border-b border-outline-variant/15">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "items"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🎨 จัดการภาพและข้อมูลผลงาน
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🔍 ตั้งค่า SEO หน้าผลงาน
        </button>
      </div>

      {activeTab === "seo" ? (
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm">
          {initialSeoPage ? (
            <PageSeoForm seoPage={initialSeoPage} onSave={handleSaveSeo} />
          ) : (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              ไม่พบข้อมูลการตั้งค่า SEO ของหน้าผลงานในระบบ
            </div>
          )}
        </div>
      ) : (
        <>
          {/* List Portfolio Items */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs">กำลังโหลดข้อมูลผลงาน...</span>
        </div>
      ) : portfolioItems.length === 0 ? (
        <div className="bg-surface-container-lowest p-16 rounded-3xl border border-outline-variant/10 text-center space-y-4">
          <FolderOpen className="w-14 h-14 text-primary/30 mx-auto" />
          <h4 className="text-base font-bold">ยังไม่มีผลงานในระบบ</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            แสดงผลงานติดตั้งจริงจะช่วยเพิ่มความน่าเชื่อถือและอัตราการติดต่อลูกค้าใหม่
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 mt-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผลงานชิ้นแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {portfolioItems.map((item) => (
            <div key={item.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="aspect-[4/3] bg-surface-container-low relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.altText}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-bold bg-black/60 text-white uppercase tracking-wider">
                    {item.category === "condo" ? "คอนโดมิเนียม" : item.category === "house" ? "บ้านพักอาศัย" : "พื้นที่เชิงพาณิชย์"}
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <h4 className="text-base font-bold text-on-surface line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1">📍 {item.location}</p>
                  <p className="text-xs font-semibold text-primary">🛡️ ฟิล์มที่ใช้: {item.seriesUsed}</p>
                  {item.areaSize && <p className="text-xs text-on-surface-variant/80">📐 ขนาดพื้นที่: {item.areaSize}</p>}
                  {item.description && (
                    <p className="text-xs text-on-surface-variant/70 line-clamp-2 pt-2 border-t border-outline-variant/5 mt-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-outline-variant/5 mt-4 flex gap-3 justify-end shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-grow py-2.5 rounded-xl bg-surface-container-low hover:bg-primary-fixed text-on-surface-variant hover:text-primary transition-all font-headline font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  disabled={deletingId === item.id}
                  className="px-4 py-2.5 rounded-xl bg-error-container/20 hover:bg-error-container text-error transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="ลบผลงาน"
                >
                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog/Modal Overlay */}
      {isFormOpen && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-outline-variant/10 animate-scaleIn">
            {/* Form Header */}
            <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-headline font-bold text-primary">
                {editingItem.id ? "แก้ไขข้อมูลผลงาน" : "เพิ่มผลงานใหม่"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleFormSubmit} className="flex-grow p-8 overflow-y-auto min-h-0 space-y-5 text-xs font-semibold text-on-surface-variant">
              
              {/* Project Title */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">ชื่อโครงการ / หัวข้อผลงาน *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น The Monument Thong Lo หรือ บ้านพักส่วนตัว เอกมัย"
                  value={editingItem.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Location & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">สถานที่ / ที่อยู่ย่อ *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ทองหล่อ, กรุงเทพฯ หรือ บางนา, สมุทรปราการ"
                    value={editingItem.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">ประเภทอสังหาริมทรัพย์ *</label>
                  <select
                    value={editingItem.category || "condo"}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  >
                    <option value="condo">คอนโดมิเนียม (Condo)</option>
                    <option value="house">บ้านเดี่ยว / ทาวน์โฮม (House)</option>
                    <option value="commercial">อาคารสำนักงาน / ร้านค้า (Commercial)</option>
                  </select>
                </div>
              </div>

              {/* Details of film specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">รุ่นฟิล์มที่ติดตั้ง *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Guardian Ceramic 35 หรือ Apex Sputter 20"
                    value={editingItem.seriesUsed || ""}
                    onChange={(e) => handleInputChange("seriesUsed", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">ขนาดพื้นที่ติดตั้ง (ระบุกำกับหน่วย)</label>
                  <input
                    type="text"
                    placeholder="เช่น 45 m² หรือ 180 ตร.ม."
                    value={editingItem.areaSize || ""}
                    onChange={(e) => handleInputChange("areaSize", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                </div>
              </div>

              {/* Image Selector */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">รูปภาพผลงานติดตั้ง *</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="https://example.com/portfolio-image.png"
                    value={editingItem.image || ""}
                    onChange={(e) => handleInputChange("image", e.target.value)}
                    className="flex-grow bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaOpen(true)}
                    className="px-5 py-4 rounded-xl bg-primary-container text-primary font-headline font-bold text-xs hover:opacity-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>คลังรูป</span>
                  </button>
                </div>
              </div>

              {/* Alt Text */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">คำอธิบายภาพ (Alt Text สำหรับ SEO)</label>
                <input
                  type="text"
                  placeholder="รายละเอียดรูปภาพเพื่อช่วย SEO หากเว้นไว้จะใช้ชื่อผลงาน"
                  value={editingItem.altText || ""}
                  onChange={(e) => handleInputChange("altText", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">รายละเอียดโครงการติดตั้ง</label>
                <textarea
                  rows={3}
                  placeholder="ระบุความยากง่ายการเก็บหน้างาน หรือประสิทธิภาพผลงานหลังติดตั้ง..."
                  value={editingItem.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low font-headline font-bold text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-primary/10"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? "กำลังบันทึก..." : "บันทึกผลงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => handleInputChange("image", url)}
        title="เลือกรูปภาพสำหรับผลงานการติดตั้ง"
      />
    </div>
  );
}
