"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  altText: string;
  seriesUsed: string;
  areaSize: string | null;
  description: string | null;
}

interface PortfolioListProps {
  initialItems?: PortfolioItem[];
  portfolioItems?: PortfolioItem[];
  showLinkToAll?: boolean;
}

export default function PortfolioList({ initialItems, portfolioItems, showLinkToAll = false }: PortfolioListProps) {
  const items = initialItems || portfolioItems || [];
  const [activeFilter, setActiveFilter] = useState<"all" | "condo" | "house">("all");

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    return item.category.toLowerCase() === activeFilter;
  });

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeFilter === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ผลงานทั้งหมด
          </button>
          <button
            onClick={() => setActiveFilter("condo")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeFilter === "condo"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            คอนโดมิเนียม
          </button>
          <button
            onClick={() => setActiveFilter("house")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeFilter === "house"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            บ้านเดี่ยว / คฤหาสน์
          </button>
        </div>

        {showLinkToAll && (
          <a
            href="/portfolio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow-sm shrink-0"
          >
            <span>ดูผลงานทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Image Frame */}
              <div className="relative overflow-hidden aspect-[16/10] bg-slate-100">
                <img
                  src={item.image}
                  alt={item.altText || item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-white tracking-widest uppercase">
                  {item.category.toUpperCase() === "CONDO" ? "CONDO" : "HOUSE"}
                </div>
              </div>

              {/* Meta details */}
              <div className="px-6 space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-accent-600 transition-colors">
                  {item.title}
                </h2>
                <p className="text-slate-500 text-xs font-medium flex items-center gap-1">
                  📍 {item.location}
                </p>
                {item.description && (
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-light line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Spec Footer */}
            <div className="p-6 mt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold bg-slate-50/50">
              <div>
                <span className="block text-[10px] font-bold text-accent-700 uppercase tracking-wider">
                  รุ่นฟิล์มที่ติดตั้ง
                </span>
                <span className="text-slate-900 font-bold">{item.seriesUsed}</span>
              </div>
              {item.areaSize && (
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    พื้นที่ติดตั้ง
                  </span>
                  <span className="text-slate-900 font-bold">{item.areaSize}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
