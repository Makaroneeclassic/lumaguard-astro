"use client";

import { useState } from "react";
import { CheckSquare, Square, Columns } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  series: string;
  technology: string;
  vlt: string;
  uvr: string;
  irr: string;
  irr2: string;
  tser: string;
  thickness?: string;
  shade?: string;
  price?: string;
}

interface ProductMatrixProps {
  products?: Product[];
}

export const SERIES_LIST = ["Element", "Shield", "Zenith", "Nexus", "Apex", "Guardian"];

export const ALL_PRODUCTS_DATA: Product[] = [
  // Element Series
  { id: "e1", name: "DNC05", series: "Element", technology: "Ceramic Film", vlt: "5%", uvr: "99%", irr: "70%", irr2: "75%", tser: "62%", price: "1100" },
  { id: "e2", name: "DNC1590", series: "Element", technology: "Ceramic Film", vlt: "15%", uvr: "99%", irr: "70%", irr2: "75%", tser: "58%", price: "1100" },
  { id: "e3", name: "DNC35", series: "Element", technology: "Ceramic Film", vlt: "35%", uvr: "99%", irr: "70%", irr2: "75%", tser: "52%", price: "1100" },

  // Shield Series
  { id: "s1", name: "IR0590 HD", series: "Shield", technology: "Nano Ceramic film", vlt: "5%", uvr: "99%", irr: "90%", irr2: "90%", tser: "68%", price: "1500" },
  { id: "s2", name: "IR2090 HD", series: "Shield", technology: "Nano Ceramic film", vlt: "20%", uvr: "99%", irr: "90%", irr2: "90%", tser: "62%", price: "1500" },
  { id: "s3", name: "IR3590 HD", series: "Shield", technology: "Nano Ceramic film", vlt: "35%", uvr: "99%", irr: "90%", irr2: "90%", tser: "56%", price: "1500" },

  // Zenith Series
  { id: "z1", name: "PNC 05 HD", series: "Zenith", technology: "Premium Nano Ceramic Film", vlt: "7%", uvr: "99%", irr: "90%", irr2: "93%", tser: "73%", price: "1800" },
  { id: "z2", name: "PNC 20 HD", series: "Zenith", technology: "Premium Nano Ceramic Film", vlt: "20%", uvr: "99%", irr: "90%", irr2: "93%", tser: "71%", price: "1800" },
  { id: "z3", name: "PNC 35 HD", series: "Zenith", technology: "Premium Nano Ceramic Film", vlt: "35%", uvr: "99%", irr: "90%", irr2: "93%", tser: "65%", price: "1800" },

  // Nexus Series
  { id: "n1", name: "SC0595", series: "Nexus", technology: "Sputtering Film", vlt: "7%", uvr: "99%", irr: "85%", irr2: "93%", tser: "75%", price: "2200" },
  { id: "n2", name: "SC2595", series: "Nexus", technology: "Sputtering Film", vlt: "25%", uvr: "99%", irr: "85%", irr2: "93%", tser: "68%", price: "2200" },
  { id: "n3", name: "SC3595", series: "Nexus", technology: "Sputtering Film", vlt: "35%", uvr: "99%", irr: "85%", irr2: "93%", tser: "65%", price: "2200" },

  // Apex Series
  { id: "a1", name: "VSN05HD", series: "Apex", technology: "Nano Sputtering Film", vlt: "7%", uvr: "99%", irr: "90%", irr2: "95%", tser: "80%", price: "2500" },
  { id: "a2", name: "VSN20HD", series: "Apex", technology: "Nano Sputtering Film", vlt: "20%", uvr: "99%", irr: "90%", irr2: "95%", tser: "76%", price: "2500" },
  { id: "a3", name: "VSN35HD", series: "Apex", technology: "Nano Sputtering Film", vlt: "35%", uvr: "99%", irr: "90%", irr2: "95%", tser: "70%", price: "2500" },

  // Guardian Series
  { id: "g1", name: "DSP 05 UHD PRO", series: "Guardian", technology: "UHD Ceramic", vlt: "5%", uvr: "100%", irr: "80%", irr2: "85%", tser: "85%", price: "2800" },
  { id: "g2", name: "DSP 15 UHD PRO", series: "Guardian", technology: "UHD Ceramic", vlt: "15%", uvr: "100%", irr: "80%", irr2: "85%", tser: "78%", price: "2800" },
  { id: "g3", name: "DSP 40 UHD", series: "Guardian", technology: "UHD Ceramic", vlt: "35%", uvr: "100%", irr: "80%", irr2: "85%", tser: "70%", price: "2800" },
];

export default function ProductMatrix({ products = [] }: ProductMatrixProps) {
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const displayProducts = products.length > 0 ? products : ALL_PRODUCTS_DATA;

  const activeSeriesList = SERIES_LIST;

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

  const filteredProducts = selectedSeries.length === 0
    ? displayProducts
    : ALL_PRODUCTS_DATA.filter((product) => selectedSeries.includes(product.series));

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
        return "bg-sky-50 text-sky-700 border-sky-200";
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
            {selectedSeries.length === 0
              ? "เปรียบเทียบสเปกซีรีส์แนะนำ หรือกดเลือกซีรีส์ฟิล์มด้านล่างเพื่อดูสเปกทุกรุ่นได้อย่างละเอียด"
              : `แสดงผลสเปกฟิล์มทุกรุ่นใน ${selectedSeries.join(", ")} Series (รวม ${filteredProducts.length} รุ่น)`}
          </p>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={toggleCompareMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline font-bold text-xs transition-all shadow-sm border min-h-[44px] ${
            isCompareMode
              ? "bg-sky-600 text-white border-sky-600 hover:bg-sky-700"
              : "bg-white text-sky-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>{isCompareMode ? "โหมดกรองทีละซีรีส์" : "เปิดโหมดเปรียบเทียบหลายซีรีส์"}</span>
        </button>
      </div>

      {/* Tabs / Selection Chips Wrapper */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-2 rounded-2xl bg-slate-100/80 border border-slate-200/60">
        {/* All Series Chip */}
        <button
          onClick={handleSelectAll}
          className={`px-4 py-2 rounded-xl font-headline font-bold text-xs transition-all cursor-pointer min-h-[40px] ${
            (!isCompareMode && selectedSeries.length === 0) || (isCompareMode && selectedSeries.length === activeSeriesList.length)
              ? "bg-sky-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60"
          }`}
        >
          <span>เปรียบเทียบทั้งหมด ({displayProducts.length})</span>
        </button>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* Individual Series Chips */}
        {activeSeriesList.map((series) => {
          const isSelected = selectedSeries.includes(series);
          const activeClass = isSelected
            ? "bg-sky-50 text-sky-700 border-sky-300 font-bold shadow-sm"
            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60";

          return (
            <button
              key={series}
              onClick={() => handleSeriesClick(series)}
              className={`px-3.5 py-2 rounded-xl font-headline font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 border min-h-[40px] ${activeClass}`}
            >
              {isCompareMode && (
                <span>
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />
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
            ไม่มีสินค้าตรงตามซีรีส์ที่เลือก กรุณาเลือกซีรีส์อื่นในการเปรียบเทียบ
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
                  <h4 className="text-base font-extrabold text-slate-900">
                    {product.series} Series {selectedSeries.length > 0 && product.name ? `(รุ่น ${product.name})` : ""}
                  </h4>
                  <span className="text-xs text-slate-500 font-light">{product.technology}</span>
                </div>
                <span className={`inline-block whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold border ${getSeriesBadgeColor(product.series)}`}>
                  {product.series}
                </span>
              </div>

              {/* Specs Grid (2x2 Stat Cards) */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">แสงผ่าน (VLT)</span>
                  <span className="font-extrabold text-slate-900 text-sm">{product.vlt}</span>
                </div>

                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-sky-600 uppercase tracking-wider">กัน UV (UVR)</span>
                  <span className="font-extrabold text-sky-700 text-sm">{product.uvr}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">กัน IR (1000-1700nm)</span>
                  <span className="font-extrabold text-slate-900 text-sm">{product.irr2}</span>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-amber-700 uppercase tracking-wider">ความร้อนรวม (TSER)</span>
                  <span className="font-extrabold text-amber-800 text-sm">{product.tser}</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">ราคาประเมิน</span>
                  <span className="text-sm font-extrabold text-sky-600">฿{product.price ? Number(product.price).toLocaleString() : "1,100"} / ตร.ม.</span>
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
                <td colSpan={6} className="p-12 text-center text-slate-400 font-light">
                  ไม่มีสินค้าตรงตามซีรีส์ที่เลือก กรุณาเลือกซีรีส์อื่นในการเปรียบเทียบ
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
                      {selectedSeries.length > 0 && product.name && (
                        <span className="text-xs font-extrabold text-slate-700 tracking-wide pl-1">
                          รุ่น {product.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 md:p-5 font-medium whitespace-nowrap">{product.technology}</td>
                  <td className="p-4 md:p-5 text-center font-mono font-bold whitespace-nowrap">{product.vlt}</td>
                  <td className="p-4 md:p-5 text-center font-mono font-bold text-emerald-600 whitespace-nowrap">{product.uvr}</td>
                  <td className="p-4 md:p-5 text-center font-mono whitespace-nowrap">{product.irr2}</td>
                  <td className="p-4 md:p-5 text-center font-mono font-bold text-amber-700 whitespace-nowrap">{product.tser}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
