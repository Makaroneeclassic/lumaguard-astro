import { AlertTriangle } from "lucide-react";

export default function DbErrorBanner({ context }: { context?: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
      <div className="text-xs leading-relaxed space-y-1">
        <p className="font-bold">
          ไม่สามารถเชื่อมต่อฐานข้อมูลได้{context ? ` (${context})` : ""}
        </p>
        <p className="font-light">
          กำลังแสดงข้อมูลตัวอย่างชั่วคราว การบันทึก/แก้ไขจะไม่มีผลจนกว่าฐานข้อมูลจะกลับมาใช้งานได้
          <br />
          ตรวจสอบ <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">DATABASE_URL</code> ใน <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env</code> และรัน{" "}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">npx prisma db push</code>
        </p>
      </div>
    </div>
  );
}
