"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X, HelpCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "./ToastProvider";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqManagerProps {
  faqModule: { id: string; key: string; title: string; subtitle: string | null; content: any };
}

export default function FaqManager({ faqModule }: FaqManagerProps) {
  const [items, setItems] = useState<FaqItem[]>(faqModule.content?.items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<FaqItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

  const handleAddNew = () => {
    setEditingIndex(null);
    setEditingItem({
      q: "",
      a: "",
    });
    setIsFormOpen(true);
  };

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingItem(items[idx]);
    setIsFormOpen(true);
  };

  const handleDelete = async (idx: number) => {
    if (!confirm("คุณต้องการลบคำถามพบบ่อยข้อนี้ใช่หรือไม่?")) return;
    
    const updatedItems = items.filter((_, i) => i !== idx);
    setItems(updatedItems);
    await saveFaqs(updatedItems);
  };

  const handleInputChange = (field: keyof FaqItem, value: any) => {
    setEditingItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.q || !editingItem?.a) return;

    let updatedItems = [...items];
    const itemToSave = editingItem as FaqItem;

    if (editingIndex !== null) {
      updatedItems[editingIndex] = itemToSave;
    } else {
      updatedItems.push(itemToSave);
    }

    setItems(updatedItems);
    setIsFormOpen(false);
    setEditingItem(null);
    setEditingIndex(null);

    await saveFaqs(updatedItems);
  };

  const saveFaqs = async (updatedItems: FaqItem[]) => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "faq",
          content: {
            ...faqModule.content,
            items: updatedItems,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("ล้มเหลวในการบันทึกข้อมูลคำถามพบบ่อย");
      }

      setStatus("success");
      toast.success("บันทึกคำถามพบบ่อยเรียบร้อยแล้ว");
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
          <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการคำถามที่พบบ่อย (FAQs)</h1>
          <p className="text-xs text-on-surface-variant">
            แก้ไขและจัดการชุดข้อมูลคำถาม-ตอบ (FAQs) ทั้งหมดของเว็บไซต์สำหรับไขข้อสงสัยให้ลูกค้า
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มคำถามใหม่</span>
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
          <HelpCircle className="w-14 h-14 text-primary/30 mx-auto" />
          <h4 className="text-base font-bold">ยังไม่มีคำถามพบบ่อยในระบบ</h4>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 mt-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มคำถามข้อแรก
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm space-y-3 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5 flex-grow">
                  <h4 className="font-headline font-bold text-primary text-sm flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant/40 font-mono">Q{idx + 1}.</span>
                    {item.q}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-light leading-relaxed pl-7">
                    {item.a}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(idx)}
                    className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer"
                    title="แก้ไขคำถาม"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="p-2 rounded-lg bg-error-container/20 hover:bg-error-container text-error transition-colors cursor-pointer"
                    title="ลบคำถาม"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                {editingIndex !== null ? "แก้ไขคำถามพบบ่อย" : "เพิ่มคำถามพบบ่อยใหม่"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-8 space-y-4 text-xs font-semibold text-on-surface-variant">
              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider">คำถาม (Question) *</label>
                <input
                  type="text"
                  required
                  value={editingItem.q || ""}
                  onChange={(e) => handleInputChange("q", e.target.value)}
                  placeholder="เขียนคำถามที่พบบ่อย..."
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase tracking-wider">คำตอบ (Answer) *</label>
                <textarea
                  rows={4}
                  required
                  value={editingItem.a || ""}
                  onChange={(e) => handleInputChange("a", e.target.value)}
                  placeholder="เขียนคำอธิบายคำตอบโดยละเอียด..."
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
                  {status === "saving" ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
