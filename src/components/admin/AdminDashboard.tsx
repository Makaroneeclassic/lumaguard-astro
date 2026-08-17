import { ToastProvider } from "./ToastProvider";
import AtAGlance from "./AtAGlance";
import DbErrorBanner from "./DbErrorBanner";
import LeadDashboard from "./LeadDashboard";

interface Props {
  stats: { leadsNew: number; leadsTotal: number; posts: number; products: number; portfolio: number };
  leads: unknown[];
  dbError: boolean;
}

/**
 * ห่อส่วนแดชบอร์ดทั้งหมดไว้ใน island เดียว
 *
 * LeadDashboard เรียก useToast() ซึ่งต้องอยู่ใต้ <ToastProvider> แต่เดิมแต่ละ
 * component ถูก mount เป็น island แยกกัน และแต่ละ island คือ React root
 * คนละต้น context จึงส่งข้ามกันไม่ได้ ต่อให้วาง provider ไว้ข้าง ๆ ก็ไม่ช่วย
 * ผลคือหน้า /admin ล้มตอนเรนเดอร์และผู้ใช้เห็นหน้าขาวหลังเข้าสู่ระบบสำเร็จ
 *
 * รวมทุกอย่างไว้ใน root เดียวจึงเป็นวิธีที่ทำให้ context ใช้งานได้จริง
 */
export default function AdminDashboard({ stats, leads, dbError }: Props) {
  return (
    <ToastProvider>
      {dbError ? <DbErrorBanner context="โหลดแดชบอร์ด" /> : <AtAGlance stats={stats} />}

      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">รายการสอบถาม (Leads) ล่าสุด</h2>
        <LeadDashboard initialLeads={leads as never} />
      </div>
    </ToastProvider>
  );
}
