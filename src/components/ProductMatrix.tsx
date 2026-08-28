"use client";

import { useMemo, useState } from "react";
import { CheckSquare, Square, Columns } from "lucide-react";
import { ALL_PRODUCTS, SERIES_LIST, type Product } from "@/lib/products";
import { CATEGORIES, getSeriesByCategory, type ProductCategory } from "@/lib/series";

// ส่งออกต่อเพื่อความเข้ากันได้กับที่อื่นที่เคยนำเข้าจากไฟล์นี้
export type { Product };
export { SERIES_LIST };

interface ProductMatrixProps {
  products?: Product[];
  /**
   * ล็อกไว้ที่หมวดเดียวและซ่อนแท็บเลือกหมวด
   *
   * ใช้ในหน้าขายของแต่ละหมวด ซึ่งคนที่เข้ามาเลือกหมวดไปแล้วตั้งแต่หน้าก่อน
   * การโชว์แท็บให้สลับไปหมวดอื่นตรงนั้นคือการชวนให้ออกจากเส้นทางที่กำลังจะซื้อ
   */
  lockCategory?: ProductCategory;
}

/**
 * หมวดที่มีซีรีส์อยู่จริงเท่านั้น
 *
 * หมวดฟิล์มนิรภัยประกาศไว้แล้วแต่ยังไม่มีซีรีส์สักตัว การโชว์แท็บเปล่า ๆ
 * ทำให้คนกดแล้วเจอตารางว่าง แท็บจะโผล่เองทันทีที่เพิ่มซีรีส์แรกของหมวดนั้น
 */
const ACTIVE_CATEGORIES = CATEGORIES.filter(
  (c) => getSeriesByCategory(c.id).length > 0,
);

export default function ProductMatrix({ products = [], lockCategory }: ProductMatrixProps) {
  const [category, setCategory] = useState<ProductCategory>(
    lockCategory ?? ACTIVE_CATEGORIES[0]?.id ?? "architectural",
  );
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const allProducts = products.length > 0 ? products : ALL_PRODUCTS;

  // ซีรีส์ของหมวดที่กำลังดู — ใช้ทั้งเป็นปุ่มกรองและเป็นลำดับแถวในตาราง
  const activeSeriesList = useMemo(
    () => getSeriesByCategory(category).map((s) => s.dbName),
    [category],
  );

  /**
   * ตารางเทียบข้ามหมวดไม่ได้ ค่าที่เทียบคนละความหมาย
   *
   * ฟิล์มอาคารกับฟิล์มรถใช้หน่วยราคาคนละแบบและติดตั้งบนกระจกคนละชนิด
   * การวางรวมกัน 35 รุ่นในตารางเดียวทำให้เทียบอะไรไม่ได้เลย
   */
  const displayProducts = useMemo(
    () => allProducts.filter((p) => activeSeriesList.includes(p.series)),
    [allProducts, activeSeriesList],
  );

  const handleCategoryChange = (next: ProductCategory) => {
    setCategory(next);
    setSelectedSeries([]);
  };

  const handleSeriesClick = (seriesName: string) => {
    if (isCompareMode) {
      if (selectedSeries.includes(seriesName)) {
        setSelectedSeries(selectedSeries.filter((s) => s !== seriesName));
      } else {
        setSelectedSeries([...selectedSeries, seriesName]);
      }
    } else {
      if (selectedSeries.length === 1 && selectedSeries[0] === seriesName) {
        setSelectedSeries([]);
      } else {
        setSelectedSeries([seriesName]);
      }
    }
  };

  const handleSelectAll = () => {
    if (isCompareMode) {
      if (selectedSeries.length === activeSeriesList.length) {
        setSelectedSeries([]);
      } else {
        setSelectedSeries([...activeSeriesList]);
      }
    } else {
      setSelectedSeries([]);
    }
  };

  const toggleCompareMode = () => {
    setIsCompareMode(!isCompareMode);
    setSelectedSeries([]);
  };

  /**
   * เลือกรุ่นที่มีค่า VLT อยู่ตรงกลางของแต่ละซีรีส์
   *
   * ตอนดูภาพรวมการโชว์ทั้ง 18 รุ่นพร้อมกันทำให้ตารางยาวเกินกว่าจะเทียบไหว
   * จึงเหลือซีรีส์ละรุ่นเป็นตัวแทน แล้วค่อยกดเข้าไปดูครบในแต่ละซีรีส์
   */
  const middleOfEachSeries = (list: Product[]) => {
    const grouped = new Map<string, Product[]>();
    for (const p of list) {
      const g = grouped.get(p.series) ?? [];
      g.push(p);
      grouped.set(p.series, g);
    }

    const picked: Product[] = [];
    // ไล่ตามลำดับใน SERIES_LIST เพื่อให้ตารางเรียงเหมือนกันทุกครั้ง
    for (const series of SERIES_LIST) {
      const group = grouped.get(series);
      if (!group?.length) continue;
      const sorted = [...group].sort(
        (a, b) => parseFloat(a.vlt) - parseFloat(b.vlt),
      );
      picked.push(sorted[Math.floor((sorted.length - 1) / 2)]);
    }
    return picked;
  };

  // เลือกซีรีส์เดียว = อยากดูรุ่นย่อยทั้งหมดของซีรีส์นั้น
  // ไม่เลือก หรือเลือกหลายซีรีส์ = กำลังเทียบข้ามซีรีส์ จึงเหลือรุ่นกลางพอ
  const scoped =
    selectedSeries.length === 0
      ? displayProducts
      : displayProducts.filter((p) => selectedSeries.includes(p.series));

  const filteredProducts =
    selectedSeries.length === 1 ? scoped : middleOfEachSeries(scoped);

  const getSeriesBadgeColor = (seriesName: string) => {
    switch (seriesName) {
      case "Element":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Shield":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Zenith":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Nexus":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Apex":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Guardian":
        return "bg-accent-50 text-accent-700 border-accent-200";
      case "Vanguard":
        return "bg-neutral-100 text-neutral-700 border-neutral-300";
      case "Metallique":
        return "bg-zinc-100 text-zinc-700 border-zinc-300";
      case "Matrix":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Stellar":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Crystalux":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-32" id="matrix">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-slate-900 tracking-tight">
            ตารางเปรียบเทียบสเปกทางเทคนิค (Performance Matrix)
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-light mt-1">
            {selectedSeries.length === 1
              ? `แสดงสเปกทุกรุ่นใน ${selectedSeries[0]} Series (${filteredProducts.length} รุ่น)`
              : `เปรียบเทียบรุ่นตัวแทนของแต่ละซีรีส์ (${filteredProducts.length} ซีรีส์) — กดเลือกซีรีส์เพื่อดูสเปกครบทุกรุ่น`}
          </p>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={toggleCompareMode}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl font-headline font-bold text-xs transition-all shadow-sm border min-h-[44px] ${
            isCompareMode
              ? "bg-primary text-on-primary border-primary hover:opacity-90"
              : "bg-white text-accent-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>{isCompareMode ? "โหมดกรองทีละซีรีส์" : "เปิดโหมดเปรียบเทียบหลายซีรีส์"}</span>
        </button>
      </div>

      {/* Category Tabs — ตารางแยกตามหมวดสินค้า */}
      {!lockCategory && ACTIVE_CATEGORIES.length > 1 && (
        <div
          role="tablist"
          aria-label="หมวดสินค้า"
          className="flex flex-wrap gap-2 mb-4 border-b border-slate-200"
        >
          {ACTIVE_CATEGORIES.map((c) => {
            const isActive = c.id === category;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleCategoryChange(c.id)}
                className={`px-4 py-3 min-h-[48px] font-headline font-bold text-sm transition-all cursor-pointer border-b-2 -mb-px ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {c.label}
                <span className="ml-2 font-normal text-xs text-slate-400">
                  {getSeriesByCategory(c.id).length} ซีรีส์
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs / Selection Chips Wrapper */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-2 rounded-2xl bg-slate-100/80 border border-slate-200/60">
        {/* All Series Chip */}
        <button
          onClick={handleSelectAll}
          className={`px-4 py-2 rounded-xl font-headline font-bold text-xs transition-all cursor-pointer min-h-[48px] ${
            (!isCompareMode && selectedSeries.length === 0) || (isCompareMode && selectedSeries.length === activeSeriesList.length)
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60"
          }`}
        >
          <span>ดูภาพรวมทุกซีรีส์</span>
        </button>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* Individual Series Chips */}
        {activeSeriesList.map((series) => {
          const isSelected = selectedSeries.includes(series);
          const activeClass = isSelected
            ? "bg-accent-50 text-accent-700 border-accent-300 font-bold shadow-sm"
            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60";

          return (
            <button
              key={series}
              onClick={() => handleSeriesClick(series)}
              className={`px-3.5 py-2 min-h-[48px] rounded-xl font-headline font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 border min-h-[40px] ${activeClass}`}
            >
              {isCompareMode && (
                <span>
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-accent-700 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </span>
              )}
              <span>{series} Series</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Spec Cards View (< 768px) */}
      <div className="block md:hidden space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs font-light">
            {selectedSeries.length === 1
              ? `${selectedSeries[0]} Series ยังไม่มีข้อมูลสเปก — อยู่ระหว่างรวบรวมจากผู้ผลิต`
              : "ไม่มีสินค้าตรงตามซีรีส์ที่เลือก กรุณาเลือกซีรีส์อื่นในการเปรียบเทียบ"}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              {/* Product Header & Series Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {product.series} Series{" "}
                    {selectedSeries.length > 0 ? `(แสงส่องผ่าน ${product.vlt})` : ""}
                  </h3>
                  <span className="text-xs text-slate-500 font-light">{product.technology}</span>
                </div>
                <span className={`inline-block whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold border ${getSeriesBadgeColor(product.series)}`}>
                  {product.series}
                </span>
              </div>

              {/* Specs Grid (2x2 Stat Cards) */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider">แสงผ่าน (VLT)</span>
                  <span className="font-extrabold text-slate-900 text-sm">{product.vlt}</span>
                </div>

                <div className="bg-accent-50 p-2.5 rounded-xl border border-accent-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-accent-700 uppercase tracking-wider">กัน UV (UVR)</span>
                  <span className="font-extrabold text-accent-700 text-sm">{product.uvr}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider">กัน IR (1000-1700nm)</span>
                  <span className="font-extrabold text-slate-900 text-sm">{product.irr2}</span>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-accent-700 uppercase tracking-wider">ความร้อนรวม (TSER)</span>
                  <span className="font-extrabold text-amber-800 text-sm">{product.tser}</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">ราคาประเมิน</span>
                  <span className="text-sm font-extrabold text-accent-700">{product.price ? `฿${Number(product.price).toLocaleString()} / ตร.ฟุต` : "สอบถามราคา"}</span>
                </div>
                <a
                  href="/contact"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all min-h-[38px] flex items-center justify-center"
                >
                  ขอใบเสนอราคา
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Comparison Table (≥ 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-900 text-white text-xs md:text-sm font-headline whitespace-nowrap">
              <th className="p-4 md:p-5 font-bold min-w-[160px]">ซีรีส์ (Series)</th>
              <th className="p-4 md:p-5 font-bold min-w-[160px]">เทคโนโลยี</th>
              <th className="p-4 md:p-5 font-bold text-center min-w-[120px]">แสงส่องผ่าน (VLT)</th>
              <th className="p-4 md:p-5 font-bold text-center min-w-[130px]">กันรังสี UV (UVR)</th>
              <th className="p-4 md:p-5 font-bold text-center min-w-[160px]">กันความร้อน IR (1000-1700nm)</th>
              <th className="p-4 md:p-5 font-bold text-center min-w-[140px]">กันความร้อนรวม (TSER)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs md:text-sm font-medium text-slate-700">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-600 font-light">
                  {selectedSeries.length === 1
              ? `${selectedSeries[0]} Series ยังไม่มีข้อมูลสเปก — อยู่ระหว่างรวบรวมจากผู้ผลิต`
              : "ไม่มีสินค้าตรงตามซีรีส์ที่เลือก กรุณาเลือกซีรีส์อื่นในการเปรียบเทียบ"}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, idx) => (
                <tr
                  key={product.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                  }`}
                >
                  <td className="p-4 md:p-5 font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-block whitespace-nowrap px-3.5 py-1 rounded-full text-xs font-bold border ${getSeriesBadgeColor(product.series)}`}>
                        {product.series} Series
                      </span>
                      {selectedSeries.length > 0 && (
                        <span className="text-xs font-extrabold text-slate-700 tracking-wide pl-1">
                          แสงส่องผ่าน {product.vlt}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 md:p-5 font-medium whitespace-nowrap">{product.technology}</td>
                  <td className="p-4 md:p-5 text-center font-mono font-bold whitespace-nowrap">{product.vlt}</td>
                  <td className="p-4 md:p-5 text-center font-mono font-bold text-emerald-600 whitespace-nowrap">{product.uvr}</td>
                  <td className="p-4 md:p-5 text-center font-mono whitespace-nowrap">{product.irr2}</td>
                  <td className="p-4 md:p-5 text-center font-mono font-bold text-accent-700 whitespace-nowrap">{product.tser}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
