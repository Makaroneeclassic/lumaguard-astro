"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface TestimonialItem {
  id: string;
  authorName: string;
  content: string;
  rating: number;
  date: string;
  initials: string;
  avatarBg: string;
}

const defaultTestimonials: TestimonialItem[] = [
  {
    id: "1",
    authorName: "คุณ พ****",
    content: "ตรงต่อเวลาดี มีมาตรฐานการทำงาน ทำงานเรียบร้อย สุภาพและมารยาทดี อุปกรณ์ครบครัน...",
    rating: 5,
    date: "31/03/2026",
    initials: "พ",
    avatarBg: "bg-slate-700",
  },
  {
    id: "2",
    authorName: "คุณ อุ****",
    content: "ทำงานเรียบร้อย ช่างสุภาพ ป้องกันความร้อนในห้องช่วงบ่ายได้ดีมาก แนะนำเพื่อนบ้านเรียบร้อยครับ",
    rating: 5,
    date: "03/05/2026",
    initials: "อ",
    avatarBg: "bg-primary",
  },
  {
    id: "3",
    authorName: "คุณ สุ****",
    content: "ตรงต่อเวลาดี ช่วยเหลือ/แก้ปัญหาได้ดี ทำงานเรียบร้อย สุภาพและมารยาทดี มีใบรับประกันดิจิทัล...",
    rating: 5,
    date: "09/07/2025",
    initials: "ส",
    avatarBg: "bg-cyan-800",
  },
  {
    id: "4",
    authorName: "คุณ ภ****",
    content: "ช่างวัดพื้นที่ละเอียดมาก ติดฟิล์มเซรามิคแล้วห้องเย็นลงทันที ค่าไฟลดลงชัดเจนครับ",
    rating: 5,
    date: "15/01/2026",
    initials: "ภ",
    avatarBg: "bg-accent-700",
  }
];

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? defaultTestimonials.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === defaultTestimonials.length - 1 ? 0 : prev + 1));
  };

  const currentMobileItem = defaultTestimonials[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8 md:space-y-12">
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-red-500 font-bold text-xs sm:text-sm tracking-wide">รีวิวลูกค้า</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            ลูกค้าพูดถึงเราว่าอย่างไร
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-light">
            รีวิวจริงจากลูกค้าที่เคยใช้บริการติดตั้งฟิล์มกับ LUMAGUARD
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative flex items-center justify-center">
          {/* Left Arrow Button */}
          <button
            onClick={prevSlide}
            className="absolute left-1 sm:left-2 md:left-4 z-10 w-10 h-10 min-w-[44px] min-h-[44px] bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Desktop/Tablet View: 3 Cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 w-full px-12 md:px-16">
            {defaultTestimonials.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex text-red-500 gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-red-500" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-light">{t.date}</span>
                  </div>
                  <p className="text-slate-700 text-sm italic leading-relaxed font-light">
                    "{t.content}"
                  </p>
                </div>

                <div>
                  <div className="border-t border-slate-100 my-4"></div>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${t.avatarBg} text-white flex items-center justify-center font-bold text-sm`}>
                      {t.initials}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{t.authorName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View: 1 Active Card */}
          <div className="block md:hidden w-full px-12">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-red-500 gap-1">
                    {[...Array(currentMobileItem.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-red-500" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-light">{currentMobileItem.date}</span>
                </div>
                <p className="text-slate-700 text-sm italic leading-relaxed font-light">
                  "{currentMobileItem.content}"
                </p>
              </div>

              <div>
                <div className="border-t border-slate-100 my-4"></div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${currentMobileItem.avatarBg} text-white flex items-center justify-center font-bold text-sm`}>
                    {currentMobileItem.initials}
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{currentMobileItem.authorName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={nextSlide}
            className="absolute right-1 sm:right-2 md:right-4 z-10 w-10 h-10 min-w-[44px] min-h-[44px] bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Next review"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2 pt-2">
          {defaultTestimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 ${
                currentIndex === idx ? "w-6 h-2 bg-red-500 rounded-full" : "w-2 h-2 bg-slate-300 rounded-full"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
