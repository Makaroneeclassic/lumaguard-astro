"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Sparkles, Loader2, Image as ImageIcon, Package } from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";
import { useToast } from "./ToastProvider";
import PageSeoForm from "./PageSeoForm";

interface Product {
  id: string;
  name: string;
  series: string;
  vlt: string;
  irr: string;
  irr2: string;
  uvr: string;
  tser: string;
  technology: string;
  thickness: string;
  description: string | null;
  image: string | null;
  price: string | null;
  showOnHomepage: boolean;
  isPopular: boolean;
}

interface ProductManagerProps {
  initialSeoPage: any;
}

export default function ProductManager({ initialSeoPage }: ProductManagerProps) {
  const [activeTab, setActiveTab] = useState<"products" | "seo">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
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
    toast.success("บันทึกการตั้งค่า SEO หน้าสินค้าเรียบร้อยแล้ว");
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        toast.error("โหลดรายการสินค้าไม่สำเร็จ");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบเครือข่าย");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingProduct({
      name: "",
      series: "Element",
      vlt: "",
      irr: "",
      irr2: "75%",
      uvr: "99.9%",
      tser: "",
      technology: "Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "",
      image: "",
      price: "",
      showOnHomepage: true,
      isPopular: false,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบสินค้าเรียบร้อยแล้ว");
        fetchProducts();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "เกิดข้อผิดพลาดในการลบสินค้า");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.vlt || !editingProduct?.irr || !editingProduct?.irr2 || !editingProduct?.tser || !editingProduct?.technology || !editingProduct?.thickness) {
      setError("โปรดกรอกฟิลด์ที่จำเป็นให้ครบถ้วน (ชื่อรุ่น, VLT, IRR 900-1000nm, IRR 1000-1700nm, TSER, เทคโนโลยี, ความหนา)");
      return;
    }

    setSubmitting(true);
    setError("");

    const isEdit = !!editingProduct.id;
    const url = isEdit ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        toast.success(isEdit ? "แก้ไขสินค้าสำเร็จแล้ว" : "เพิ่มสินค้าสำเร็จแล้ว");
        setIsFormOpen(false);
        setEditingProduct(null);
        fetchProducts();
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

  const handleInputChange = (field: keyof Product, value: any) => {
    setEditingProduct((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 font-body">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการหน้าสินค้า</h1>
          <p className="text-xs text-on-surface-variant">ปรับปรุงและเปรียบเทียบสเปกฟิล์ม และตั้งค่า SEO สำหรับหน้ารวมสินค้า</p>
        </div>
        {activeTab === "products" && (
          <button
            onClick={handleAddNew}
            className="bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรุ่นสินค้าใหม่</span>
          </button>
        )}
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex border-b border-outline-variant/15">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          📦 จัดการรุ่นสินค้า & สเปก
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🔍 ตั้งค่า SEO หน้าสินค้า
        </button>
      </div>

      {activeTab === "seo" ? (
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm">
          {initialSeoPage ? (
            <PageSeoForm seoPage={initialSeoPage} onSave={handleSaveSeo} />
          ) : (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              ไม่พบข้อมูลการตั้งค่า SEO ของหน้าสินค้าในระบบ
            </div>
          )}
        </div>
      ) : (
        <>
          {/* List Products */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs">กำลังโหลดข้อมูลสินค้า...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-surface-container-lowest p-16 rounded-3xl border border-outline-variant/10 text-center space-y-4">
          <Package className="w-14 h-14 text-primary/30 mx-auto" />
          <h4 className="text-base font-bold">ยังไม่มีสินค้าในฐานข้อมูล</h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            เพิ่มรุ่นฟิล์มเพื่อแสดงบนหน้าเปรียบเทียบสินค้า และให้ระบบแนะนำฟิล์มใช้งานได้
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 mt-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสินค้ารุ่นแรก
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-outline-variant/10 shadow-sm bg-surface-container-lowest">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/10 font-headline font-bold text-on-surface-variant">
                <th className="p-4">รุ่นผลิตภัณฑ์</th>
                <th className="p-4">ซีรีส์</th>
                <th className="p-4">เทคโนโลยี</th>
                <th className="p-4 text-center">VLT</th>
                <th className="p-4 text-center">IRR 900-1000nm</th>
                <th className="p-4 text-center">IRR 1000-1700nm</th>
                <th className="p-4 text-center">UVR</th>
                <th className="p-4 text-center">TSER</th>
                <th className="p-4 text-center">ความหนา</th>
                <th className="p-4 text-center">ราคา / ตร.ม.</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface-variant font-medium">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-surface-container-low/20 transition-colors text-[11px] md:text-xs">
                  <td className="p-4 font-bold text-primary">{product.name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      product.series === "Apex"
                        ? "bg-tertiary/10 text-tertiary"
                        : product.series === "Guardian"
                        ? "bg-primary/10 text-primary"
                        : product.series === "Shield"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : product.series === "Zenith"
                        ? "bg-purple-500/10 text-purple-600"
                        : product.series === "Nexus"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {product.series}
                    </span>
                  </td>
                  <td className="p-4 font-light">{product.technology}</td>
                  <td className="p-4 text-center font-mono">{product.vlt}</td>
                  <td className="p-4 text-center font-mono">{product.irr}</td>
                  <td className="p-4 text-center font-mono">{product.irr2}</td>
                  <td className="p-4 text-center font-mono">{product.uvr}</td>
                  <td className="p-4 text-center font-mono">{product.tser}</td>
                  <td className="p-4 text-center font-mono text-[10px] font-light">{product.thickness}</td>
                  <td className="p-4 text-center font-mono font-bold text-primary">{product.price ? `${Number(product.price).toLocaleString()} บ.` : "-"}</td>
                  <td className="p-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {product.showOnHomepage ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          แสดงหน้าแรก
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant/50 text-[10px] font-bold">
                          ซ่อน
                        </span>
                      )}
                      {product.isPopular && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                          รุ่นยอดนิยม ★
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg bg-surface-container-low hover:bg-primary-fixed text-on-surface-variant hover:text-primary transition-colors"
                        title="แก้ไขสเปก"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="p-2 rounded-lg bg-error-container/20 hover:bg-error-container text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="ลบสินค้า"
                      >
                        {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog/Modal Overlay */}
      {isFormOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-outline-variant/10 animate-scaleIn">
            {/* Form Header */}
            <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-headline font-bold text-primary">
                {editingProduct.id ? "แก้ไขสเปกสินค้า" : "เพิ่มสินค้าใหม่"}
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
              {/* Product Name */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">ชื่อรุ่นผลิตภัณฑ์ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Guardian Ceramic 35"
                  value={editingProduct.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Series selection */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">ซีรีส์สินค้า *</label>
                <select
                  value={editingProduct.series || "Element"}
                  onChange={(e) => handleInputChange("series", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                >
                  <option value="Element">Element</option>
                  <option value="Shield">Shield</option>
                  <option value="Zenith">Zenith</option>
                  <option value="Nexus">Nexus</option>
                  <option value="Apex">Apex</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              {/* Technology input */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">เทคโนโลยีฟิล์ม (Technology) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Ceramic Film หรือ Nano Sputtering Film"
                  value={editingProduct.technology || ""}
                  onChange={(e) => handleInputChange("technology", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Tech Specs Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">VLT (แสงส่องผ่าน) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 5% หรือ 35%"
                    value={editingProduct.vlt || ""}
                    onChange={(e) => handleInputChange("vlt", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">ความหนา (Thickness) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 2MIL (50 micron)"
                    value={editingProduct.thickness || ""}
                    onChange={(e) => handleInputChange("thickness", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">IRR 900-1000nm *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 90%"
                    value={editingProduct.irr || ""}
                    onChange={(e) => handleInputChange("irr", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">IRR 1000-1700nm *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 93%"
                    value={editingProduct.irr2 || ""}
                    onChange={(e) => handleInputChange("irr2", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">UVR (ป้องกันรังสี UV) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 99%"
                    value={editingProduct.uvr || "99%"}
                    onChange={(e) => handleInputChange("uvr", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block uppercase tracking-wider">TSER (การลดความร้อนรวม) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 62%"
                    value={editingProduct.tser || ""}
                    onChange={(e) => handleInputChange("tser", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
                  />
                </div>
              </div>

              {/* Show on Homepage & Is Popular toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-high/40 p-4 rounded-xl border border-outline-variant/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface">แสดงในหน้าแรก</label>
                    <span className="text-[9px] text-on-surface-variant font-light block">ดึงรุ่นนี้ไปแสดงในส่วนเปรียบเทียบหน้าแรก</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingProduct.showOnHomepage ?? true}
                    onChange={(e) => handleInputChange("showOnHomepage", e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 md:border-l md:border-outline-variant/10 md:pl-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface">รุ่นยอดนิยม (ไฮไลต์)</label>
                    <span className="text-[9px] text-on-surface-variant font-light block">ใช้สีพื้นหลังน้ำเงินเด่นขยายขนาดการ์ด</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingProduct.isPopular ?? false}
                    onChange={(e) => handleInputChange("isPopular", e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
              </div>

              {/* Image selector */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">รูปภาพประกอบสินค้า</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="https://example.com/product.png"
                    value={editingProduct.image || ""}
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

              {/* Description */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">รายละเอียด / สรุปย่อ</label>
                <textarea
                  rows={3}
                  placeholder="คำอธิบายเบื้องต้นของฟิล์มรุ่นนี้..."
                  value={editingProduct.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">ราคาเริ่มต้น (บาท/ตร.ม. หรือราคาประเมิน) *</label>
                <input
                  type="text"
                  placeholder="เช่น 1,500 หรือ 15,000"
                  value={editingProduct.price || ""}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* Form Footer Actions inside content */}
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
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}

      {/* Media Selector modal */}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => handleInputChange("image", url)}
        title="เลือกรูปภาพสินค้า"
      />
    </div>
  );
}
