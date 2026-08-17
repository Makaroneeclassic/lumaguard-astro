"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bold, Italic, Underline, List, ListOrdered, Quote, 
  Link as LinkIcon, Image as ImageIcon, Code, Eye, 
  AlignLeft, AlignCenter, AlignRight, Eraser
} from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Sync internal HTML content with incoming prop only when prop is changed externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string = "") => {
    if (disabled) return;
    
    // Focus the editor before executing
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    document.execCommand(command, false, arg);
    handleEditorInput();
  };

  const handleFormatBlock = (value: string) => {
    executeCommand("formatBlock", value);
  };

  const saveSelection = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        setSavedRange(sel.getRangeAt(0).cloneRange());
      }
    }
  };

  const restoreSelection = () => {
    if (typeof window !== "undefined" && savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }
  };

  const handleAddLink = () => {
    saveSelection();
    const url = prompt("กรุณาระบุ URL ของลิงก์:");
    if (url) {
      restoreSelection();
      executeCommand("createLink", url);
    }
  };

  const handleAddImageClick = () => {
    saveSelection();
    setMediaOpen(true);
  };

  const handleSelectImage = (url: string) => {
    setMediaOpen(false);
    restoreSelection();
    
    // Insert modern premium styled image tag
    const imgHtml = `<img src="${url}" alt="บทความ Lumaguard" class="w-full my-8 rounded-2xl object-cover max-h-[500px] shadow-md border border-outline-variant/10" />`;
    executeCommand("insertHTML", imgHtml);
  };

  const toggleMode = () => {
    setIsHtmlMode(!isHtmlMode);
  };

  return (
    <div className="border border-outline-variant/10 rounded-2xl overflow-hidden bg-surface-container-lowest font-body shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-surface-container-low border-b border-outline-variant/10 shrink-0 items-center">
        {!isHtmlMode ? (
          <>
            {/* Format block Selector */}
            <select
              onChange={(e) => handleFormatBlock(e.target.value)}
              disabled={disabled}
              className="bg-surface-container-lowest text-xs text-on-surface-variant font-headline font-bold border border-outline-variant/20 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20 mr-1 cursor-pointer"
              title="รูปแบบย่อหน้าข้อความ"
              defaultValue="P"
            >
              <option value="P">ข้อความปกติ (P)</option>
              <option value="H1">หัวข้อหลักเพจ (H1 - ไม่แนะนำสำหรับการเขียนเนื้อหา)</option>
              <option value="H2">หัวข้อย่อยหลัก (H2)</option>
              <option value="H3">หัวข้อย่อยรอง (H3)</option>
              <option value="H4">หัวข้อย่อยเล็ก (H4)</option>
              <option value="BLOCKQUOTE">กล่องคำพูด (Quote)</option>
              <option value="PRE">บล็อกโค้ด (Pre)</option>
            </select>

            <div className="w-[1px] h-6 bg-outline-variant/20 self-center mx-1"></div>

            {/* Styling */}
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="ตัวหนา"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="ตัวเอียง"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("underline")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="ขีดเส้นใต้"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-outline-variant/20 self-center mx-1"></div>

            {/* Alignment */}
            <button
              type="button"
              onClick={() => executeCommand("justifyLeft")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="จัดชิดซ้าย"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyCenter")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="จัดกึ่งกลาง"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyRight")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="จัดชิดขวา"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-outline-variant/20 self-center mx-1"></div>

            {/* Lists */}
            <button
              type="button"
              onClick={() => executeCommand("insertUnorderedList")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="รายการสัญลักษณ์แบบจุด"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("insertOrderedList")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="รายการลำดับตัวเลข"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("formatBlock", "BLOCKQUOTE")}
              disabled={disabled}
              className="p-2.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors hidden"
              title="กล่องข้อความอ้างอิง"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-outline-variant/20 self-center mx-1"></div>

            {/* Links & Images */}
            <button
              type="button"
              onClick={handleAddLink}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="ใส่ลิงก์เชื่อมโยง"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddImageClick}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="แทรกรูปภาพจากคลังรูปภาพ"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-outline-variant/20 self-center mx-1"></div>

            {/* Clear styles */}
            <button
              type="button"
              onClick={() => executeCommand("removeFormat")}
              disabled={disabled}
              className="p-2 rounded-lg hover:bg-surface-container-high text-error hover:bg-error-container/20 transition-colors"
              title="ล้างสไตล์และการจัดรูปแบบ"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-[10px] text-on-surface-variant/60 font-semibold px-3 py-2">
            โหมดแก้ไขโค้ดดิ้ง HTML (คุณสามารถพิมพ์โค้ด HTML จัดรูปแบบอย่างอิสระ)
          </div>
        )}

        <div className="flex-grow"></div>

        <button
          type="button"
          onClick={toggleMode}
          className="p-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-colors flex items-center gap-1.5 font-headline font-bold text-xs"
          title={isHtmlMode ? "สลับเป็นโหมดเขียนปกติ" : "สลับเป็นโหมดแก้ไข HTML"}
        >
          {isHtmlMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>โหมดปกติ</span>
            </>
          ) : (
            <>
              <Code className="w-3.5 h-3.5" />
              <span>แก้ไข HTML</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[300px]">
        {/* Rich View */}
        <div
          ref={editorRef}
          contentEditable={!isHtmlMode && !disabled}
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          className={`w-full min-h-[300px] p-6 focus:outline-none overflow-y-auto text-sm text-on-surface leading-relaxed font-light prose prose-slate max-w-none ${
            isHtmlMode ? "hidden" : "block"
          }`}
          style={{
            direction: "ltr",
          }}
        />

        {/* Source View (Raw HTML Textarea) */}
        {isHtmlMode && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={12}
            className="w-full min-h-[300px] p-6 focus:outline-none bg-surface-container-low text-xs text-on-surface font-mono border-none leading-relaxed resize-y"
            placeholder="<html>..."
          />
        )}
      </div>

      {/* Embedded Media Library Selector */}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleSelectImage}
        title="เลือกรูปภาพเพื่อแทรกในบทความ"
      />
    </div>
  );
}
