"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X, Image as ImageIcon, Check, Loader2, Trash2 } from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  title = "คลังรูปภาพและอัปโหลด",
}: MediaLibraryModalProps) {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedUrl(null);
      setTab("library");
      setError("");
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      } else {
        setError("ไม่สามารถดึงข้อมูลคลังรูปภาพได้");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อคลังรูปภาพ");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        await fetchMedia();
        setSelectedUrl(data.url);
        setTab("library");
      } else {
        const errData = await res.json();
        setError(errData.error || "อัปโหลดรูปภาพล้มเหลว");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation(); // Prevent selection when clicking delete
    if (!confirm("คุณต้องการลบรูปภาพนี้ออกจากเซิร์ฟเวอร์ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    setDeletingName(filename);
    setError("");
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        if (selectedUrl === `/uploads/${filename}`) {
          setSelectedUrl(null);
        }
        await fetchMedia();
      } else {
        const errData = await res.json();
        setError(errData.error || "ลบรูปภาพล้มเหลว");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบรูปภาพ");
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

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-outline-variant/10">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-headline font-bold text-primary flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="px-8 border-b border-outline-variant/5 bg-surface-container-low/30 flex shrink-0">
          <button
            onClick={() => setTab("library")}
            className={`py-4 px-4 font-headline font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              tab === "library"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            คลังรูปภาพ ({mediaList.length})
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`py-4 px-4 font-headline font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              tab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            อัปโหลดไฟล์ใหม่
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-8 mt-4 bg-error-container text-error px-4 py-3 rounded-xl text-xs font-semibold shrink-0 animate-fadeIn">
            {error}
          </div>
        )}

        {/* Modal Content Area */}
        <div className="flex-grow p-8 overflow-y-auto min-h-0">
          {tab === "library" ? (
            loading && mediaList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs">กำลังโหลดรูปภาพ...</span>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                <ImageIcon className="w-16 h-16 opacity-30" />
                <p className="text-sm font-semibold">ยังไม่มีรูปภาพในคลัง</p>
                <button
                  onClick={() => setTab("upload")}
                  className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-headline font-bold text-xs hover:opacity-95 transition-opacity shadow-md"
                >
                  อัปโหลดรูปแรกของคุณ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {mediaList.map((file) => {
                  const isSelected = selectedUrl === file.url;
                  const isDeleting = deletingName === file.name;
                  return (
                    <div
                      key={file.name}
                      onClick={() => setSelectedUrl(file.url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-surface-container-low group cursor-pointer ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 scale-[0.98] shadow-md"
                          : "border-outline-variant/15 hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/25 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        </div>
                      )}
                      
                      {/* Delete button (displays on hover) */}
                      <button
                        onClick={(e) => handleDeleteFile(e, file.name)}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-error transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="ลบรูปภาพนี้"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white p-2 text-[9px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
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
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm font-bold text-on-surface">กำลังอัปโหลดรูปภาพ...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">ลากและวางรูปภาพที่นี่</p>
                    <p className="text-xs text-on-surface-variant mt-1">หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/60">รองรับ JPEG, PNG, WEBP, GIF, SVG (สูงสุด 5MB)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-outline-variant/10 bg-surface-container-low/20 flex justify-between items-center shrink-0">
          <div className="text-xs text-on-surface-variant truncate max-w-lg">
            {selectedUrl ? (
              <span>เลือกรูปภาพแล้ว: <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-primary">{selectedUrl}</code></span>
            ) : (
              <span>โปรดเลือกรูปภาพจากคลัง หรืออัปโหลดไฟล์ใหม่</span>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low font-headline font-bold text-xs transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedUrl}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ใช้รูปภาพนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
