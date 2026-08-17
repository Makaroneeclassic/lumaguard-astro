"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Star, MessageSquare, AlertCircle } from "lucide-react";
import { useToast } from "./ToastProvider";

interface TestimonialItem {
  authorName: string;
  role: string;
  content: string;
  rating: number;
}

interface TestimonialsManagerProps {
  testimonialsModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
}

export default function TestimonialsManager({ testimonialsModule }: TestimonialsManagerProps) {
  const [items, setItems] = useState<TestimonialItem[]>(testimonialsModule.content?.items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<TestimonialItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  const handleAddNew = () => {
    setEditingIndex(null);
    setEditingItem({
      authorName: "",
      role: "เจ้าของบ้าน",
      rating: 5,
      content: "",
    });
    setIsFormOpen(true);
  };

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingItem(items[idx]);
    setIsFormOpen(true);
  };

  const handleDelete = async (idx: number) => {
    if (!confirm("คุณต้องการลบรีวิวลูกค้ารายนี้ใช่หรือไม่?")) return;
    
    const updatedItems = items.filter((_, i) => i !== idx);
    setItems(updatedItems);
    await saveTestimonials(updatedItems);
  };

  const handleInputChange = (field: keyof TestimonialItem, value: any) => {
    setEditingItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.authorName || !editingItem?.content) return;

    let updatedItems = [...items];
    const itemToSave = editingItem as TestimonialItem;

    if (editingIndex !== null) {
      updatedItems[editingIndex] = itemToSave;
    } else {
      updatedItems.push(itemToSave);
    }

    setItems(updatedItems);
    setIsFormOpen(false);
    setEditingItem(null);
    setEditingIndex(null);

    await saveTestimonials(updatedItems);
  };

  const saveTestimonials = async (updatedItems: TestimonialItem[]) => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "testimonials",
          content: {
            ...testimonialsModule.content,
            items: updatedItems,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("ล้มเหลวในการบันทึกข้อมูลรีวิวลูกค้า");
      }

      setStatus("success");
      toast.success("บันทึกข้อมูลรีวิวลูกค้าเรียบร้อยแล้ว");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
  };

  return (
    <div className="space-y-8 font-body">
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการรีวิวจากลูกค้า</h1>
          <p className="text-xs text-on-surface-variant">
            แก้ไขและจัดการข้อความรีวิวประทับใจ คะแนน และรายชื่อลูกค้าเพื่อแสดงความน่าเชื่อถือบนหน้าเว็บ
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรีวิวใหม่</span>
        </button>
      </div>

      {status === "error" && (
        <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-surface-container-lowest p-16 rounded-3xl border border-outline-variant/10 text-center space-y-4">
          <MessageSquare className="w-14 h-14 text-primary/30 mx-auto" />
          <h4 className="text-base font-bold">ยังไม่มีรีวิวลูกค้าในระบบ</h4>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 mt-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรีวิวคนแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-headline font-bold text-on-surface text-sm">{item.authorName}</h4>
                    <span className="text-[10px] text-on-surface-variant/60">{item.role}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < item.rating ? "fill-current" : "text-outline-variant/40"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/80 font-light leading-relaxed">
                  "{item.content}"
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-outline-variant/5">
                <button
                  onClick={() => handleEdit(idx)}
                  className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer"
                  title="แก้ไขรีวิว"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(idx)}
                  className="p-2 rounded-lg bg-error-container/20 hover:bg-error-container text-error transition-colors cursor-pointer"
                  title="ลบรีวิว"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog/Modal */}
      {isFormOpen && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-outline-variant/10 animate-scaleIn">
            <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-headline font-bold text-primary">
                {editingIndex !== null ? "แก้ไขรีวิวลูกค้า" : "เพิ่มรีวิวลูกค้าใหม่"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-8 space-y-4 text-xs font-semibold text-on-surface-variant">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider">ชื่อผู้ให้รีวิว *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.authorName || ""}
                    onChange={(e) => handleInputChange("authorName", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase tracking-wider">บทบาท/ตำแหน่ง *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.role || "เจ้าของบ้าน"}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider">คะแนนดาวรีวิว *</label>
                <div className="flex gap-2 pt-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <Star
                      key={stars}
                      onClick={() => handleInputChange("rating", stars)}
                      className={`w-6 h-6 cursor-pointer ${
                        stars <= (editingItem.rating || 5) ? "fill-current" : "text-outline-variant/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider">ข้อความรีวิวความประทับใจ *</label>
                <textarea
                  rows={4}
                  required
                  value={editingItem.content || ""}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="เขียนข้อความที่ลูกค้าประทับใจ..."
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low font-headline font-bold text-xs transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="px-6 py-3 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {status === "saving" ? "กำลังบันทึก..." : "บันทึกรีวิว"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
