"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { technologyOf, lowestPrice } from "@/lib/products";

/**
 * เครื่องประเมินราคาติดตั้งฟิล์ม
 *
 * ราคาทุกจุดเป็นบาทต่อตารางฟุต ซึ่งเป็นหน่วยที่วงการฟิล์มในไทยใช้กัน
 * ค่าที่ส่งเข้ามาคือราคาจริงจาก src/data/products.json ผ่าน getEstimatorRates
 * ถ้าไม่ส่งมาจะถอยไปอ่านจากไฟล์สินค้าโดยตรง ตัวเลขจึงตรงกันเสมอไม่ว่าทางไหน
 */
interface PriceEstimatorProps {
  rates?: Record<string, number>;
}

/**
 * ซีรีส์ที่นำมาเทียบให้ดู เรียงจากราคาต่ำไปสูง
 *
 * เลือกสามระดับที่ต่างกันชัดเจนเพื่อให้เห็นช่วงราคา ไม่ใช่ทั้งหกซีรีส์
 * ซึ่งจะทำให้ตัดสินใจยากขึ้น คำบรรยายอ้างอิงจากคุณสมบัติจริงใน series.ts
 */
const FEATURED = [
  {
    series: "Shield",
    blurb: "นาโนเซรามิกระดับพรีเมียม ป้องกันรังสีความร้อนสูง",
  },
  {
    series: "Apex",
    blurb: "สปัตเตอร์เคลือบโลหะมีค่า สะท้อนความร้อนขีดสุด",
  },
  {
    series: "Guardian",
    blurb: "เซรามิกเกรดพิเศษ สว่างเคลียร์ใส กัน UV 100%",
    flagship: true,
  },
] as const;

const AREA_MIN = 100;
const AREA_MAX = 5000;

export default function PriceEstimator({ rates }: PriceEstimatorProps) {
  // ค่าเริ่มต้นราว 1,200 ตร.ฟุต เทียบเท่าบ้านขนาดกลางที่ติดทั้งหลัง
  const [area, setArea] = useState(1200);

  const rateOf = (series: string) => rates?.[series] ?? lowestPrice(series);
  const headlineRate = rateOf("Guardian");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(price);

  const remember = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage?.setItem("lg_estimated_area", area.toString());
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    gtag?.("event", "calculate_estimate", {
      estimated_area_sqft: area,
      selected_series: "Guardian",
    });
  };

  // เปอร์เซ็นต์ของแถบที่ถูกเติมสี ใช้วาดสีพื้นหลังให้ไล่ตามหัวเลื่อน
  const fill = ((area - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* แผงคำนวณหลัก */}
      <div className="lg-estimator relative overflow-hidden rounded-[28px] p-7 md:p-9">
        <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
          {/* ซ้าย: หัวเรื่อง */}
          <div className="flex-1 space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-400/25 bg-accent-400/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-accent-300 font-headline">
              <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
              เครื่องคำนวณงบประมาณ
            </div>
            <h2 className="text-2xl md:text-[28px] font-headline font-bold text-white tracking-tight leading-snug">
              ประเมินราคาติดตั้ง
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
              เลื่อนแถบพื้นที่กระจกเพื่อดูงบประมาณโดยประมาณทันที
            </p>
          </div>

          {/* กลาง: แถบเลื่อน */}
          <div className="w-full lg:w-[340px] space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium text-slate-400 tracking-wide">พื้นที่กระจกรวม</span>
              <span className="text-white text-2xl font-headline font-bold tabular-nums tracking-tight">
                {area.toLocaleString()}
                <span className="text-sm font-medium text-slate-400 ml-1.5">ตร.ฟุต</span>
              </span>
            </div>

            <input
              type="range"
              min={AREA_MIN}
              max={AREA_MAX}
              step={50}
              value={area}
              aria-label="พื้นที่กระจกรวมเป็นตารางฟุต"
              onChange={(e) => setArea(parseInt(e.target.value, 10))}
              onMouseUp={remember}
              onTouchEnd={remember}
              onKeyUp={remember}
              className="lg-range w-full"
              style={{ ["--fill" as string]: `${fill}%` }}
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium tabular-nums">
              <span>100</span>
              <span>2,500</span>
              <span>5,000 ตร.ฟุต</span>
            </div>
          </div>

          {/* ขวา: ผลลัพธ์ */}
          <div className="shrink-0 w-full lg:w-auto flex flex-col items-center lg:items-end justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-10 text-center lg:text-right">
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-bold font-headline mb-2">
              ประมาณการเริ่มต้น
            </span>
            <span className="text-[40px] leading-none font-headline font-black text-white tracking-tighter tabular-nums">
              {formatPrice(area * headlineRate)}
            </span>
            <span className="mt-3 text-[11px] text-slate-500 leading-relaxed max-w-[190px]">
              อ้างอิงรุ่น Guardian ฿{headlineRate}/ตร.ฟุต
              <br />
              ราคาจริงขึ้นกับหน้างานและจำนวนบาน
            </span>
          </div>
        </div>
      </div>

      {/* การ์ดเปรียบเทียบรายซีรีส์ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURED.map(({ series, blurb, ...rest }) => {
          const flagship = "flagship" in rest && rest.flagship;
          const rate = rateOf(series);
          return (
            <div
              key={series}
              className={
                flagship
                  ? "lg-card-flagship relative rounded-2xl p-6 text-center flex flex-col"
                  : "relative rounded-2xl border border-outline-variant/25 bg-white p-6 text-center flex flex-col transition-shadow hover:shadow-md"
              }
            >
              {flagship && (
                <span className="absolute top-0 right-0 rounded-bl-xl rounded-tr-2xl bg-primary px-3 py-1 text-[10px] font-bold tracking-wide text-white font-headline">
                  รุ่นเรือธง
                </span>
              )}

              <h3
                className={`font-headline font-bold text-lg tracking-tight ${
                  flagship ? "text-primary" : "text-on-surface"
                }`}
              >
                {series} Series
              </h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-on-surface-variant/70 font-medium">
                {technologyOf(series)}
              </p>

              <p
                className={`mt-4 text-[32px] leading-none font-headline font-black tabular-nums tracking-tighter ${
                  flagship ? "text-primary" : "text-on-surface"
                }`}
              >
                {formatPrice(area * rate)}
              </p>
              <p className="mt-1.5 text-xs text-on-surface-variant tabular-nums">
                ฿{rate}/ตร.ฟุต
              </p>

              <p className="mt-4 pt-4 border-t border-outline-variant/20 text-xs leading-relaxed text-on-surface-variant">
                {blurb}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
