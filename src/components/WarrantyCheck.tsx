import { useState } from "react";

/**
 * ตรวจใบรับประกันกับระบบหลังบ้าน
 *
 * ระบบหลังบ้านตอบเฉพาะข้อมูลที่ปิดบางส่วนแล้ว ไม่มีชื่อหรือเบอร์ลูกค้า
 * และอนุญาตให้เว็บนี้เรียกข้ามโดเมนได้
 */

const OFFICE_URL = (import.meta.env.PUBLIC_OFFICE_URL || "https://office.thongkorn46.com").replace(/\/$/, "");

interface Warranty {
  warrantyNo: string;
  status: "active" | "expiring" | "expired" | null;
  statusLabel: string | null;
  filmModel: string | null;
  siteType: string | null;
  plate: string | null;
  warrantyYears: number;
  deliveredAt: string;
  warrantyEnd: string;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" }).format(new Date(value));

export default function WarrantyCheck() {
  const [number, setNumber] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "missing" | "error">("idle");
  const [warranty, setWarranty] = useState<Warranty | null>(null);

  async function check(event: React.FormEvent) {
    event.preventDefault();
    const value = number.trim().toUpperCase();
    if (!value) return;
    setState("loading");
    try {
      const res = await fetch(`${OFFICE_URL}/api/public/warranty/${encodeURIComponent(value)}`);
      if (res.status === 404) {
        setState("missing");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      setWarranty(body.warranty);
      setState("found");
    } catch {
      setState("error");
    }
  }

  const valid = warranty && warranty.status !== "expired";
  const rows: [string, string | null][] = warranty
    ? [
        ["เลขที่", warranty.warrantyNo],
        ["รุ่นฟิล์ม", warranty.filmModel],
        ["ชนิดงาน", warranty.siteType],
        ["ทะเบียนรถ", warranty.plate],
        ["ระยะรับประกัน", `${warranty.warrantyYears} ปี`],
        ["วันที่ติดตั้ง", formatDate(warranty.deliveredAt)],
        ["หมดประกันวันที่", formatDate(warranty.warrantyEnd)],
      ]
    : [];

  return (
    <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
      <form onSubmit={check} className="space-y-3">
        <label htmlFor="warranty-no" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          เลขที่ใบรับประกัน
        </label>
        <input
          id="warranty-no"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="W-LG-2569-0001"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-500"
          autoComplete="off"
          required
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full rounded-xl bg-slate-900 text-white font-bold py-3 hover:bg-slate-800 disabled:opacity-60"
        >
          {state === "loading" ? "กำลังตรวจสอบ…" : "ตรวจสอบ"}
        </button>
      </form>

      {state === "missing" ? <p className="text-center text-sm text-red-600">ไม่พบเลขใบรับประกันนี้ กรุณาตรวจเลขอีกครั้ง</p> : null}
      {state === "error" ? <p className="text-center text-sm text-red-600">ตรวจสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p> : null}

      {state === "found" && warranty ? (
        <div className="space-y-4">
          <p className={`text-center font-bold ${valid ? "text-emerald-600" : "text-red-600"}`}>{warranty.statusLabel}</p>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            {rows
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
