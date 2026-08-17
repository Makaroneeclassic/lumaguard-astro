"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Save, ArrowLeft, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
const useRouter = () => ({ push: (url: string) => { if (typeof window !== "undefined") window.location.href = url; } });
const Link = ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>;
import MediaLibraryModal from "./MediaLibraryModal";
import RichTextEditor from "./RichTextEditor";

interface BlogPostFormProps {
  initialData?: any;
  mode: "create" | "edit";
}

export default function BlogPostForm({ initialData, mode }: BlogPostFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    authorName: "Marcus Thorne",
    authorImage: "",
    category: "Energy Efficiency",
    readingTime: "5 min read",
    published: true,
    seoTitle: "",
    seoDesc: "",
    seoKeywords: "",
    noindex: false,
    ogImage: "",
    faq: "",
  });

  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaSelectField, setMediaSelectField] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        slug: initialData.slug || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        coverImage: initialData.coverImage || "",
        authorName: initialData.authorName || "Marcus Thorne",
        authorImage: initialData.authorImage || "",
        category: initialData.category || "Energy Efficiency",
        readingTime: initialData.readingTime || "5 min read",
        published: initialData.published !== undefined ? initialData.published : true,
        seoTitle: initialData.seoTitle || "",
        seoDesc: initialData.seoDesc || "",
        seoKeywords: initialData.seoKeywords || "",
        noindex: initialData.noindex || false,
        ogImage: initialData.ogImage || "",
        faq: initialData.faq || "",
      });

      // Parse FAQs JSON string to items
      try {
        if (initialData.faq) {
          setFaqItems(JSON.parse(initialData.faq));
        } else {
          setFaqItems([]);
        }
      } catch (e) {
        setFaqItems([]);
      }
    }
  }, [initialData]);

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
      .replace(/\s+/g, "-") // collapse whitespace and replace by -
      .replace(/-+/g, "-"); // collapse dashes
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: mode === "create" ? generateSlug(val) : prev.slug,
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      setStatus("error");
      setErrorMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (หัวข้อ, Slug, และเนื้อหา)");
      return;
    }

    setStatus("submitting");
    try {
      const url = mode === "create" ? "/api/blog" : `/api/blog/${initialData.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      // Serialize FAQs to string
      const serializedFaq = JSON.stringify(faqItems);
      const updatedFormData = { ...formData, faq: serializedFaq };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลบทความ");
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/admin/blog");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="space-y-8 font-body">
      {/* Header bar */}
      <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6">
        <Link
          href="/admin/blog"
          className="p-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            {mode === "create" ? "เขียนบทความใหม่" : "แก้ไขเนื้อหาบทความ"}
          </h1>
          <p className="text-xs text-on-surface-variant">
            กรอกรายละเอียดเนื้อหา และข้อมูล SEO สำหรับใช้ในการสืบค้นข้อมูล
          </p>
        </div>
      </div>

      {status === "success" && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-primary">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>บันทึกบทความสำเร็จแล้ว! ระบบกำลังนำทางท่านกลับ...</span>
        </div>
      )}

      {status === "error" && (
        <div className="bg-error-container text-error p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Main Content fields */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
          <h3 className="text-xl font-headline font-bold text-primary pb-4 border-b border-outline-variant/10">
            เนื้อหาบทความหลัก (Main Content)
          </h3>

          <div className="space-y-6 text-xs font-semibold text-on-surface-variant">
            {/* Title */}
            <div className="space-y-2">
              <label className="block uppercase tracking-wider">หัวข้อบทความ *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={status === "submitting"}
                className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="block uppercase tracking-wider">Slug (เส้นทาง URL) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                disabled={status === "submitting"}
                className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light font-mono"
              />
            </div>

            {/* Category, Author, Reading Time, Author Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block uppercase tracking-wider">หมวดหมู่</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                >
                  <option value="Energy Efficiency">Energy Efficiency</option>
                  <option value="Home Security">Home Security</option>
                  <option value="Interior Design">Interior Design</option>
                  <option value="Product Spotlight">Product Spotlight</option>
                  <option value="Aesthetics">Aesthetics</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-wider">เวลาในการอ่าน (เช่น 5 min read)</label>
                <input
                  type="text"
                  value={formData.readingTime}
                  onChange={(e) => handleInputChange("readingTime", e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-wider">ชื่อผู้เขียน</label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => handleInputChange("authorName", e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="block uppercase tracking-wider">รูปผู้เขียน</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="/uploads/author.png"
                    value={formData.authorImage}
                    onChange={(e) => handleInputChange("authorImage", e.target.value)}
                    disabled={status === "submitting"}
                    className="flex-grow bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaSelectField("authorImage")}
                    className="px-5 py-4 rounded-xl bg-primary-container text-primary font-headline font-bold text-xs hover:opacity-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>เลือกรูป</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Image URL */}
            <div className="space-y-2">
              <label className="block uppercase tracking-wider">รูปภาพหน้าปก *</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={formData.coverImage}
                  onChange={(e) => handleInputChange("coverImage", e.target.value)}
                  disabled={status === "submitting"}
                  className="flex-grow bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
                <button
                  type="button"
                  onClick={() => setMediaSelectField("coverImage")}
                  className="px-5 py-4 rounded-xl bg-primary-container text-primary font-headline font-bold text-xs hover:opacity-95 transition-all shrink-0 flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>เลือกรูป</span>
                </button>
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label className="block uppercase tracking-wider">บทสรุปย่อ (Excerpt)</label>
              <textarea
                rows={3}
                value={formData.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                disabled={status === "submitting"}
                className="w-full bg-surface-container-high border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
              />
            </div>

            {/* Content WYSIWYG Editor */}
            <div className="space-y-2">
              <label className="block uppercase tracking-wider font-bold">เนื้อหาบทความหลัก *</label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleInputChange("content", value)}
                disabled={status === "submitting"}
              />
            </div>

            {/* FAQ Builder Section */}
            <div className="space-y-4 pt-6 border-t border-outline-variant/10">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm uppercase tracking-wider font-bold text-primary">คำถามที่พบบ่อย (FAQs) รายบทความ</h4>
                  <p className="text-[10px] text-on-surface-variant/60 font-light mt-0.5">เพิ่มคำถามพบบ่อยเพื่อแสดงผลและทำ SEO Rich Snippet อัตโนมัติ</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFaqItems([...faqItems, { q: "", a: "" }])}
                  className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-headline font-bold transition-all flex items-center gap-1"
                >
                  + เพิ่มคำถาม
                </button>
              </div>

              {faqItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-outline-variant/30 rounded-2xl text-[11px] text-on-surface-variant/50 font-light">
                  ยังไม่มีการเพิ่มคำถามพบบ่อยในบทความนี้ (หากไม่เพิ่ม ระบบจะไม่แสดงและไม่มี Schema FAQ)
                </div>
              ) : (
                <div className="space-y-4">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-surface-container-high/40 border border-outline-variant/10 rounded-2xl space-y-3 relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-primary">คำถามข้อที่ {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...faqItems];
                            updated.splice(idx, 1);
                            setFaqItems(updated);
                          }}
                          className="text-error hover:underline text-[10px] font-bold"
                        >
                          ลบคำถาม
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="เช่น ฟิล์มรุ่นนี้ดีต่อบ้านอย่างไร?"
                          value={item.q}
                          onChange={(e) => {
                            const updated = [...faqItems];
                            updated[idx].q = e.target.value;
                            setFaqItems(updated);
                          }}
                          className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-primary/20 focus:bg-white text-xs text-on-surface font-medium"
                        />
                        <textarea
                          placeholder="คำตอบ..."
                          rows={2}
                          value={item.a}
                          onChange={(e) => {
                            const updated = [...faqItems];
                            updated[idx].a = e.target.value;
                            setFaqItems(updated);
                          }}
                          className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-primary/20 focus:bg-white text-xs text-on-surface font-light leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Article SEO configuration */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SEO Block */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
            <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-primary pb-3 border-b border-outline-variant/10">
              ข้อมูล SEO รายบทความ
            </h3>

            <div className="space-y-4 text-xs font-semibold text-on-surface-variant">
              {/* SEO Title */}
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px]">SEO Title (แท็กหัวข้อ)</label>
                <input
                  type="text"
                  placeholder="หากปล่อยว่างจะใช้ หัวข้อบทความ"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* SEO Description */}
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px]">SEO Description</label>
                <textarea
                  rows={3}
                  placeholder="หากปล่อยว่างจะใช้ บทสรุปย่อ"
                  value={formData.seoDesc}
                  onChange={(e) => handleInputChange("seoDesc", e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* SEO Keywords */}
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px]">คีย์เวิร์ดบทความ (คั่นด้วยจุลภาค)</label>
                <input
                  type="text"
                  placeholder="เช่น ฟิล์มเซรามิค, ลดความร้อน"
                  value={formData.seoKeywords}
                  onChange={(e) => handleInputChange("seoKeywords", e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                />
              </div>

              {/* OG Image */}
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px]">OG Image สำหรับแชร์</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="หากปล่อยว่างจะใช้ รูปภาพหน้าปก"
                    value={formData.ogImage}
                    onChange={(e) => handleInputChange("ogImage", e.target.value)}
                    disabled={status === "submitting"}
                    className="flex-grow bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm text-on-surface font-light"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaSelectField("ogImage")}
                    className="px-3.5 py-3 rounded-xl bg-primary-container text-primary font-headline font-bold text-[10px] hover:opacity-95 transition-all shrink-0 flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>เลือก</span>
                  </button>
                </div>
              </div>

              {/* Robots & Status */}
              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={formData.noindex}
                    onChange={(e) => handleInputChange("noindex", e.target.checked)}
                    disabled={status === "submitting"}
                    className="rounded text-primary focus:ring-primary/20 w-4 h-4 bg-surface-container-high border-none"
                  />
                  <span>ห้ามทำดัชนีหน้านี้ (noindex)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => handleInputChange("published", e.target.checked)}
                    disabled={status === "submitting"}
                    className="rounded text-primary focus:ring-primary/20 w-4 h-4 bg-surface-container-high border-none"
                  />
                  <span>เปิดเผยแพร่สาธารณะ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action button card */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-primary text-on-primary py-4.5 rounded-xl font-headline font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {status === "submitting" ? "กำลังบันทึก..." : "บันทึกและเผยแพร่"}
            </button>
          </div>

        </div>
      </form>

      <MediaLibraryModal
        isOpen={mediaSelectField !== null}
        onClose={() => setMediaSelectField(null)}
        onSelect={(url) => {
          if (mediaSelectField) {
            handleInputChange(mediaSelectField, url);
          }
        }}
        title={`เลือกรูปภาพสำหรับ ${
          mediaSelectField === "coverImage"
            ? "หน้าปกบทความ"
            : mediaSelectField === "ogImage"
            ? "รูปแชร์โซเชียล (OG Image)"
            : "รูปผู้เขียน"
        }`}
      />
    </div>
  );
}
