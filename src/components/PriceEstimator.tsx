"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

export default function PriceEstimator() {
  const [area, setArea] = useState(120);

  // Price rates per square meter (approx calculated from Stitch designs)
  const elementRate = 415;  // Condo (30m²) = 12,500 (~415/m²)
  const guardianRate = 630; // Condo (30m²) = 18,900 (~630/m²)
  const apexRate = 950;     // Condo (30m²) = 28,500 (~950/m²)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Estimator Input Card */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-center gap-8">
        
        {/* Left column: Text info */}
        <div className="flex-grow space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-accent-600 bg-accent-50 px-3 py-1 rounded-full text-xs font-bold font-headline">
            <Calculator className="w-4 h-4" />
            เครื่องคำนวณงบประมาณ
          </div>
          <h2 className="text-xl font-headline font-bold text-white">เครื่องประเมินราคาอัจฉริยะ</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xs">
            เลื่อนแถบพื้นที่ตารางเมตรเพื่อรับการประมาณการค่าบริการติดตั้งและผลิตภัณฑ์ในทันที
          </p>
        </div>

        {/* Center column: Slider Input */}
        <div className="w-full md:w-80 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-300">พื้นที่กระจกรวม:</span>
            <span className="text-accent-400 text-lg font-headline font-black">{area} ตร.ม.</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            value={area}
            onChange={(e) => setArea(parseInt(e.target.value))}
            onMouseUp={() => {
              if (typeof window !== "undefined") {
                if (window.sessionStorage) {
                  window.sessionStorage.setItem("lg_estimated_area", area.toString());
                }
                if ((window as any).gtag) {
                  (window as any).gtag("event", "calculate_estimate", {
                    estimated_area_sqm: area,
                    selected_series: "Guardian"
                  });
                }
              }
            }}
            onTouchEnd={() => {
              if (typeof window !== "undefined") {
                if (window.sessionStorage) {
                  window.sessionStorage.setItem("lg_estimated_area", area.toString());
                }
                if ((window as any).gtag) {
                  (window as any).gtag("event", "calculate_estimate", {
                    estimated_area_sqm: area,
                    selected_series: "Guardian"
                  });
                }
              }
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent-500"
          />
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>10 ตร.ม.</span>
            <span>250 ตร.ม.</span>
            <span>500 ตร.ม.</span>
          </div>
        </div>

        {/* Right column: Results overview */}
        <div className="flex flex-col items-center md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-700 pt-6 md:pt-0 md:pl-8 text-center md:text-right min-w-[200px]">
          <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider mb-1">
            ประมาณการเริ่มต้น
          </span>
          <span className="text-3xl font-headline font-black text-accent-400 tracking-tighter leading-none mb-4">
            {formatPrice(area * guardianRate)}*
          </span>
          <a
            href="/contact"
            className="text-xs text-slate-400 hover:text-slate-300 hover:underline font-medium font-headline block"
          >
            *อ้างอิงจากราคาเฉลี่ยรุ่น Guardian Ceramic
          </a>
        </div>
      </div>

      {/* Comparative pricing cards details inside estimator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Element Series */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-2">
          <h3 className="font-headline font-bold text-slate-600 text-sm">Element (Carbon)</h3>
          <p className="text-2xl font-headline font-black text-slate-900">{formatPrice(area * elementRate)}</p>
          <span className="text-xs text-slate-500 block font-light">ฟิล์มคาร์บอนระดับเริ่มต้น ดำเข้ม สวยงาม</span>
        </div>

        {/* Guardian Series */}
        <div className="bg-accent-50 p-6 rounded-2xl border border-accent-200 text-center space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-accent-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg font-headline">
            รุ่นยอดนิยม
          </div>
          <h3 className="font-headline font-bold text-accent-900 text-sm">Guardian (Ceramic)</h3>
          <p className="text-2xl font-headline font-black text-accent-700">{formatPrice(area * guardianRate)}</p>
          <span className="text-xs text-accent-800 block font-medium">ฟิล์มเซรามิกระดับกลาง กันความร้อนดีเยี่ยม</span>
        </div>

        {/* Apex Series */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-2">
          <h3 className="font-headline font-bold text-slate-600 text-sm">Apex (Sputtered)</h3>
          <p className="text-2xl font-headline font-black text-slate-900">{formatPrice(area * apexRate)}</p>
          <span className="text-xs text-slate-500 block font-light">สปัตเตอร์ฟิล์มระดับท็อป สะท้อนความร้อนสูงสุด</span>
        </div>
      </div>
    </div>
  );
}
