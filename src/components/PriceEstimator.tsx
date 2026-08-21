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
  { series: "Shield", blurb: "นาโนเซรามิกระดับพรีเมียม ป้องกันรังสีความร้อนสูง", badge: null },
  { series: "Apex", blurb: "สปัตเตอร์เคลือบโลหะมีค่า สะท้อนความร้อนขีดสุด", badge: "รุ่นยอดนิยม" },
  { series: "Guardian", blurb: "เซรามิกเกรดพิเศษ สว่างเคลียร์ใส กัน UV 100%", badge: null },
] as const;

/**
 * ช่วงพื้นที่ของแถบเลื่อน
 *
 * บ้านและคอนโดทั่วไปไม่เกินหนึ่งพันตารางฟุต การเปิดช่วงถึงห้าพันทำให้ต้องลาก
 * ไกลกว่าจำเป็นและได้ตัวเลขที่ไม่สะท้อนงานจริง งานที่ใหญ่กว่านี้เป็นอาคารซึ่ง
 * ต้องประเมินหน้างานอยู่แล้ว จึงให้ติดต่อทีมขายแทนการโชว์ตัวเลขที่อาจคลาดเคลื่อน
 */
const AREA_MIN = 100;
const AREA_MAX = 1000;

export default function PriceEstimator({ rates }: PriceEstimatorProps) {
  const [area, setArea] = useState(400);

  const rateOf = (series: string) => rates?.[series] ?? lowestPrice(series);

  // ตัวเลขใหญ่อ้างอิงซีรีส์ที่ติดป้ายไว้ ไม่ได้เขียนชื่อตายตัว ย้ายป้ายไปซีรีส์ไหน
  // ตัวเลขก็ตามไปเอง เดิมอ้างอิง Guardian แบบตายตัวจึงหลุดจากป้ายเมื่อย้าย
  const headline = FEATURED.find((f) => f.badge) ?? FEATURED[0];
  const headlineRate = rateOf(headline.series);

  /** เกินช่วงที่ประเมินเองได้ ต้องให้ทีมขายดูหน้างาน */
  const needsQuote = area >= AREA_MAX;

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
      selected_series: headline.series,
      over_range: needsQuote,
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
          <div className="flex-1 min-w-0 space-y-3 text-center lg:text-left">
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
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">
            <div className="flex justify-between items-baseline gap-3">
              <span className="text-xs font-medium text-slate-400 tracking-wide">พื้นที่กระจกรวม</span>
              <span className="text-white text-2xl font-headline font-bold tabular-nums tracking-tight whitespace-nowrap">
                {`${area.toLocaleString()}${needsQuote ? "+" : ""}`}
                <span className="text-sm font-medium text-slate-400 ml-1.5">ตร.ฟุต</span>
              </span>
            </div>

            <input
              type="range"
              min={AREA_MIN}
              max={AREA_MAX}
              step={25}
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
              <span>500</span>
              <span>1,000+ ตร.ฟุต</span>
            </div>
          </div>

          {/* ขวา: ผลลัพธ์ */}
          <div className="shrink-0 w-full lg:w-[210px] flex flex-col items-center lg:items-end justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 text-center lg:text-right">
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-bold font-headline mb-2">
              ประมาณการ
            </span>

            {needsQuote ? (
              <>
                <span className="text-[26px] leading-tight font-headline font-bold text-white tracking-tight">
                  ติดต่อทีมขาย
                </span>
                <a
                  href="/contact"
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-white font-headline transition-colors hover:bg-accent-400 min-h-[44px]"
                >
                  ขอใบเสนอราคา
                </a>
                <span className="mt-3 text-[11px] text-slate-500 leading-relaxed max-w-[190px]">
                  งานขนาดใหญ่ประเมินหน้างานฟรี ไม่มีค่าใช้จ่าย
                </span>
              </>
            ) : (
              <>
                <span className="text-[38px] leading-none font-headline font-black text-white tracking-tighter tabular-nums whitespace-nowrap">
                  {formatPrice(area * headlineRate)}
                </span>
                <span className="mt-3 text-[11px] text-slate-500 leading-relaxed max-w-[190px]">
                  {`อ้างอิงรุ่น ${headline.series} ฿${headlineRate}/ตร.ฟุต`}
                  <br />
                  ราคาจริงขึ้นกับหน้างานและจำนวนบาน
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* การ์ดเปรียบเทียบรายซีรีส์ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURED.map(({ series, blurb, badge }) => {
          const rate = rateOf(series);
          return (
            <div
              key={series}
              className={
                // min-w-0 จำเป็น เพราะคอลัมน์ grid ขนาด 1fr จะยืดตามข้อความที่ยาวเกิน
                // ทำให้การ์ดกว้างไม่เท่ากันเมื่อตัวเลขราคามีหลักมากขึ้น
                (badge
                  ? "lg-card-flagship "
                  : "border border-outline-variant/25 bg-white transition-shadow hover:shadow-md ") +
                "relative min-w-0 rounded-2xl p-6 text-center flex flex-col"
              }
            >
              {badge && (
                <span className="absolute top-0 right-0 rounded-bl-xl rounded-tr-2xl bg-primary px-3 py-1 text-[10px] font-bold tracking-wide text-white font-headline">
                  {badge}
                </span>
              )}

              <h3
                className={`font-headline font-bold text-lg tracking-tight ${
                  badge ? "text-primary" : "text-on-surface"
                }`}
              >
                {`${series} Series`}
              </h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-on-surface-variant/70 font-medium">
                {technologyOf(series)}
              </p>

              {needsQuote ? (
                <p
                  className={`mt-4 text-2xl leading-tight font-headline font-bold tracking-tight ${
                    badge ? "text-primary" : "text-on-surface"
                  }`}
                >
                  ติดต่อทีมขาย
                </p>
              ) : (
                <>
                  <p
                    className={`mt-4 text-[28px] leading-none font-headline font-black tabular-nums tracking-tighter ${
                      badge ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {formatPrice(area * rate)}
                  </p>
                  <p className="mt-1.5 text-xs text-on-surface-variant tabular-nums">
                    {`฿${rate}/ตร.ฟุต`}
                  </p>
                </>
              )}

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
