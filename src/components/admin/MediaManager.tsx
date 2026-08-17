"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useToast } from "./ToastProvider";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

export default function MediaManager() {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      } else {
        toast.error("ไม่สามารถดึงข้อมูลคลังรูปภาพได้");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success(`อัปโหลด "${file.name}" สำเร็จ`);
        fetchMedia();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData?.error || "อัปโหลดรูปภาพล้มเหลว");
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`คุณต้องการลบรูปภาพ "${filename}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

    setDeletingName(filename);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        toast.success("ลบรูปภาพสำเร็จ");
        fetchMedia();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData?.error || "ลบรูปภาพล้มเหลว");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setDeletingName(null);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 font-body">
      {/* Header Banner */}
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">คลังเก็บรูปภาพหลังบ้าน</h1>
          <p className="text-xs text-on-surface-variant">อัปโหลดและจัดการรูปภาพส่วนกลางเพื่อนำไปใช้งานกับหน้าเนื้อหา บล็อก และสินค้า</p>
        </div>
      </div>

      {/* Split layout: Upload Area and Media Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload box */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
          <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-primary pb-3 border-b border-outline-variant/10">
            อัปโหลดไฟล์ใหม่
          </h3>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors p-4 ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-outline-variant/30 hover:border-primary/60 hover:bg-surface-container-low/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept="image/*"
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-on-surface">กำลังอัปโหลดรูปภาพ...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="w-8 h-8 text-primary" />
                <p className="text-xs font-bold text-on-surface">ลากไฟล์รูปภาพมาที่นี่</p>
                <p className="text-[10px] text-on-surface-variant/70">หรือคลิกเพื่อเลือกไฟล์</p>
                <span className="text-[9px] text-on-surface-variant/40 mt-1 block">PNG, JPEG, WEBP, GIF, SVG (สูงสุด 5MB)</span>
              </div>
            )}
          </div>
        </div>

        {/* Gallery list */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
          <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-primary pb-3 border-b border-outline-variant/10">
            รายการไฟล์รูปภาพในคลัง ({mediaList.length})
          </h3>

          {loading && mediaList.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">กำลังโหลดรูปภาพ...</span>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="py-16 text-center space-y-3 text-on-surface-variant">
              <ImageIcon className="w-16 h-16 opacity-30 mx-auto" />
              <p className="text-sm font-bold">ยังไม่มีรูปภาพใดๆ อัปโหลดไว้</p>
              <p className="text-xs font-light max-w-sm mx-auto">
                ลากไฟล์รูปมาที่ช่องด้านซ้าย หรือคลิกช่องอัปโหลดเพื่อเลือกไฟล์ครั้งแรกของคุณ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fadeIn">
              {mediaList.map((file) => {
                const isDeleting = deletingName === file.name;
                return (
                  <div
                    key={file.name}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-outline-variant/15 hover:border-primary/50 group bg-surface-container-low transition-all"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Overlay specs */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white text-[10px]">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDeleteFile(file.name)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                          title="ลบไฟล์รูปภาพถาวร"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="space-y-0.5 truncate">
                        <p className="font-bold truncate">{file.name}</p>
                        <p className="opacity-80">ขนาด: {formatSize(file.size)}</p>
                        <p className="opacity-80 truncate" title={file.url}>URL: <span className="bg-white/20 px-1 rounded font-mono">{file.url}</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
