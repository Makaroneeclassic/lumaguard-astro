"use client";

import { useState } from "react";
const Link = ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>;
import { FileText, Plus, Edit, Trash2, Calendar, Eye, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "./ToastProvider";

interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  createdAt: Date;
}

import PageSeoForm from "./PageSeoForm";

interface BlogManagerProps {
  initialPosts: AdminBlogPost[];
  initialSeoPage: any;
}

export default function BlogManager({ initialPosts, initialSeoPage }: BlogManagerProps) {
  const [activeTab, setActiveTab] = useState<"blogs" | "seo">("blogs");
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [busyId, setBusyId] = useState<string | null>(null);
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
    toast.success("บันทึกการตั้งค่า SEO หน้าบทความบล็อกเรียบร้อยแล้ว");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบบทความ "${title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนคืนได้`)) {
      return;
    }
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });

      if (res.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== id));
        toast.success("ลบบทความเรียบร้อยแล้ว");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "ลบบทความไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบเครือข่ายและลองใหม่");
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePublish = async (post: AdminBlogPost) => {
    if (busyId) return;
    setBusyId(post.id);
    const newStatus = !post.published;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: newStatus } : p)));
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newStatus }),
      });
      if (!res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: post.published } : p)));
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "เปลี่ยนสถานะไม่สำเร็จ กรุณาลองใหม่");
      } else {
        toast.success(newStatus ? "เผยแพร่บทความแล้ว" : "เปลี่ยนเป็นฉบับร่างแล้ว");
      }
    } catch (e) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: post.published } : p)));
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">จัดการหน้าบทความบล็อก</h1>
          <p className="text-xs text-on-surface-variant">
            เขียนเนื้อหา สารบัญ และตั้งค่า SEO สำหรับหน้ารวมบทความบล็อก
          </p>
        </div>
        {activeTab === "blogs" && (
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            <span>เขียนบทความใหม่</span>
          </Link>
        )}
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex border-b border-outline-variant/15">
        <button
          onClick={() => setActiveTab("blogs")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "blogs"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          📝 จัดการรายการบทความ
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-3 font-headline font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          🔍 ตั้งค่า SEO หน้าบล็อก
        </button>
      </div>

      {activeTab === "seo" ? (
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm">
          {initialSeoPage ? (
            <PageSeoForm seoPage={initialSeoPage} onSave={handleSaveSeo} />
          ) : (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              ไม่พบข้อมูลการตั้งค่า SEO ของหน้าบล็อกในระบบ
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Blog List Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm">
        {posts.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <BookOpen className="w-14 h-14 text-primary/30 mx-auto" />
            <h4 className="text-base font-bold text-on-surface">ยังไม่มีบทความในระบบ</h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              เริ่มเขียนบทความแรกเพื่อเพิ่มโอกาสให้เว็บติดอันดับ Google และให้ความรู้กับลูกค้า
            </p>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 mt-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              เขียนบทความแรก
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant/80 text-[10px] font-headline font-bold uppercase tracking-wider border-b border-outline-variant/10">
                  <th className="p-6">หัวข้อบทความ</th>
                  <th className="p-6">หมวดหมู่</th>
                  <th className="p-6">วันที่เผยแพร่</th>
                  <th className="p-6">สถานะ</th>
                  <th className="p-6 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5 text-xs font-semibold text-on-surface-variant">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <span className="block font-bold text-on-surface text-sm line-clamp-1">{post.title}</span>
                          <span className="block text-[10px] font-mono text-on-surface-variant/60 font-normal">
                            ลิงก์: /blog/{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">{post.category}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-1.5 font-normal text-on-surface-variant/70">
                        <Calendar className="w-4 h-4 text-on-surface-variant/30" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(post)}
                        disabled={busyId === post.id}
                        title={post.published ? "คลิกเพื่อเปลี่ยนเป็นฉบับร่าง" : "คลิกเพื่อเผยแพร่"}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-wait ${
                          post.published
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {busyId === post.id ? "..." : post.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                      </button>
                    </td>
                    <td className="p-6 text-right space-x-2 shrink-0">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-flex p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary text-on-surface-variant transition-colors"
                        title="ดูหน้าเว็บจริง"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/blog/edit/${post.id}`}
                        className="inline-flex p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary text-on-surface-variant transition-colors"
                        title="แก้ไขเนื้อหา"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={busyId === post.id}
                        className="inline-flex p-2 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-error text-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="ลบออก"
                      >
                        {busyId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
