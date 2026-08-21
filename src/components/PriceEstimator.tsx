"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { technologyOf } from "@/lib/products";

interface PriceEstimatorProps {
  /** ราคาต่อตารางฟุต ดึงจาก src/data/products.json ผ่าน getEstimatorRates */
  rates?: { element: number; guardian: number; apex: number };
}

export default function PriceEstimator({ rates }: PriceEstimatorProps) {
  // ค่าเริ่มต้นราว 1,200 ตร.ฟุต เทียบเท่าบ้านขนาดกลางที่ติดทั้งหลัง
  const [area, setArea] = useState(1200);

  // ราคาทั้งหมดเป็นบาทต่อตารางฟุต ซึ่งเป็นหน่วยที่วงการฟิล์มในไทยใช้กัน
  // ค่าที่ส่งเข้ามาคือราคาจริงจากไฟล์สินค้า ตัวเลขสำรองด้านล่างใช้เฉพาะกรณี
  // ที่หน้าเรียกใช้โดยไม่ส่ง rates มา ซึ่งไม่ควรเกิดขึ้นในหน้าจริง
  const elementRate = rates?.element ?? 89;
  const guardianRate = rates?.guardian ?? 259;
  const apexRate = rates?.apex ?? 229;

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
          <div className="inline-flex items-center gap-2 text-accent-700 bg-accent-50 px-3 py-1 rounded-full text-xs font-bold font-headline">
            <Calculator className="w-4 h-4" />
            เครื่องคำนวณงบประมาณ
          </div>
          <h2 className="text-xl font-headline font-bold text-white">เครื่องประเมินราคาอัจฉริยะ</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xs">
            เลื่อนแถบพื้นที่ตารางฟุตเพื่อรับการประมาณการค่าบริการติดตั้งและผลิตภัณฑ์ในทันที
          </p>
        </div>

        {/* Center column: Slider Input */}
        <div className="w-full md:w-80 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-300">พื้นที่กระจกรวม:</span>
            <span className="text-white text-lg font-headline font-black">{area.toLocaleString()} ตร.ฟุต</span>
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="50"
            value={area}
            onChange={(e) => setArea(parseInt(e.target.value))}
            onMouseUp={() => {
              if (typeof window !== "undefined") {
                if (window.sessionStorage) {
                  window.sessionStorage.setItem("lg_estimated_area", area.toString());
                }
                if ((window as any).gtag) {
                  (window as any).gtag("event", "calculate_estimate", {
                    estimated_area_sqft: area,
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
                    estimated_area_sqft: area,
                    selected_series: "Guardian"
                  });
                }
              }
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent-500"
          />
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>100 ตร.ฟุต</span>
            <span>2,500 ตร.ฟุต</span>
            <span>5,000 ตร.ฟุต</span>
          </div>
        </div>

        {/* Right column: Results overview */}
        <div className="flex flex-col items-center md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-700 pt-6 md:pt-0 md:pl-8 text-center md:text-right min-w-[200px]">
          <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider mb-1">
            ประมาณการเริ่มต้น
          </span>
          <span className="text-3xl font-headline font-black text-white tracking-tighter leading-none mb-4">
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
          <h3 className="font-headline font-bold text-slate-600 text-sm">{`Element (${technologyOf("Element")})`}</h3>
          <p className="text-2xl font-headline font-black text-slate-900">{formatPrice(area * elementRate)}</p>
          <span className="text-xs text-slate-500 block font-light">เซรามิกระดับเริ่มต้น ดำเข้มสนิท สัญญาณผ่าน 100%</span>
        </div>

        {/* Guardian Series */}
        <div className="bg-accent-50 p-6 rounded-2xl border border-accent-200 text-center space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-accent-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg font-headline">
            รุ่นยอดนิยม
          </div>
          <h3 className="font-headline font-bold text-accent-900 text-sm">{`Guardian (${technologyOf("Guardian")})`}</h3>
          <p className="text-2xl font-headline font-black text-accent-700">{formatPrice(area * guardianRate)}</p>
          <span className="text-xs text-accent-800 block font-medium">เซรามิกเกรดพิเศษ สว่างเคลียร์ใส กัน UV 100%</span>
        </div>

        {/* Apex Series */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-2">
          <h3 className="font-headline font-bold text-slate-600 text-sm">{`Apex (${technologyOf("Apex")})`}</h3>
          <p className="text-2xl font-headline font-black text-slate-900">{formatPrice(area * apexRate)}</p>
          <span className="text-xs text-slate-500 block font-light">สปัตเตอร์เคลือบโลหะมีค่า สะท้อนความร้อนขีดสุด</span>
        </div>
      </div>
    </div>
  );
}
