"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, HelpCircle, RefreshCw, Phone, MessageSquare } from "lucide-react";

interface Question {
  id: number;
  title: string;
  subtitle: string;
  options: {
    value: string;
    label: string;
    description: string;
    icon: string;
  }[];
}

export default function FilmSelector() {
  const [step, setStep] = useState<number>(0); // 0 = Intro, 1 = Q1, 2 = Q2, 3 = Q3, 4 = Loading, 5 = Result
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [recommendedFilm, setRecommendedFilm] = useState<any>(null);

  const questions: Question[] = [
    {
      id: 1,
      title: "ประเภทสถานที่ติดตั้งของคุณคืออะไร?",
      subtitle: "เพื่อวิเคราะห์ระดับความร้อนและการรับแดดเฉลี่ยของโครงสร้างกระจก",
      options: [
        { value: "condo", label: "ห้องชุดคอนโดมิเนียม", description: "รับแดดและลมแรงในระดับความสูง ไม่มีร่มไม้บดบัง", icon: "🏢" },
        { value: "house", label: "บ้านเดี่ยว / ทาวน์โฮม", description: "พื้นที่กว้าง มีหลายทิศทางรับแดด ต้องการความสว่างกลมกลืน", icon: "🏡" },
        { value: "commercial", label: "อาคารสำนักงาน / ร้านค้า", description: "ต้องการประหยัดไฟสูงสุดและเปิดรับทัศนียภาพภายนอกชัดเจน", icon: "🏬" }
      ]
    },
    {
      id: 2,
      title: "ปัญหาหลักที่คุณต้องการแก้ไขเร่งด่วนที่สุด?",
      subtitle: "เพื่อระบุสเปกการลดความร้อนอินฟราเรด (IRR) และความสว่างที่เหมาะสม",
      options: [
        { value: "heat", label: "ห้องร้อนระอุ แอร์ทำงานหนัก", description: "เน้นการสกัดความร้อนสะสมและการลดความร้อนรวมสูงสุด (TSER)", icon: "🔥" },
        { value: "glare", label: "แสงจ้าสะท้อนแสบตา", description: "เน้นการกรองแสงและทัศนียภาพที่เคลียร์คมชัดระดับ HD", icon: "👁️" },
        { value: "privacy", label: "ต้องการความเป็นส่วนตัวสูง", description: "เน้นฟิล์มเข้ม ส่องมองภายนอกชัดเจน แต่ข้างนอกมองเข้ามาไม่เห็น", icon: "🔒" }
      ]
    },
    {
      id: 3,
      title: "ทิศทางการรับแดดของห้องหลักของคุณ?",
      subtitle: "เพื่อประเมินระดับความเข้มของฟิล์ม (VLT) ที่เหมาะสมกับแดดแต่ละช่วงเวลา",
      options: [
        { value: "west-south", label: "ทิศตะวันตก / ทิศใต้ (รับแดดบ่ายร้อนจัด)", description: "แดดส่องยาวนาน แนะนำฟิล์มเข้มปานกลาง-เข้มพิเศษ", icon: "☀️" },
        { value: "east-north", label: "ทิศตะวันออก / ทิศเหนือ (แดดเช้าสลัว)", description: "รับแสงนวลตา แนะนำฟิล์มใสสว่างพิเศษเน้นกันความร้อนสะสม", icon: "🌅" },
        { value: "multi", label: "มีกระจกหลายทิศทาง / ไม่แน่ใจ", description: "แดดส่องตลอดวัน แนะนำระดับความเข้มเอนกประสงค์ยอดนิยม", icon: "🧭" }
      ]
    }
  ];

  const handleSelectOption = (value: string) => {
    const currentQ = questions[step - 1];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      // หน้า Loading จำลองการคำนวณ
      setStep(4);
      setTimeout(() => {
        calculateRecommendation();
      }, 1500);
    }
  };

  const calculateRecommendation = () => {
    const q1 = answers[1]; // condo, house, commercial
    const q2 = answers[2]; // heat, glare, privacy
    const q3 = answers[3]; // west-south, east-north, multi

    let film: any = {};

    // Logic ง่ายๆ ในการเลือกฟิล์มที่ดีที่สุดให้ลูกค้า
    if (q2 === "privacy") {
      film = {
        name: "Apex Sputter 20",
        series: "Apex Series",
        vlt: "22%",
        irr: "98%",
        uvr: "99.9%",
        tser: "76%",
        accent: "ความเป็นส่วนตัวสูง & กันความร้อนขีดสุด",
        description: "ที่สุดแห่งนวัตกรรมสปัตเตอร์หลายชั้นให้โทนสีดำเข้มขรึมภายนอก แต่ให้ทัศนวิสัยส่องสว่างนวลตาจากภายใน ปิดกั้นพลังงานความร้อนแดดได้สูงสุดถึง 76% เหมาะสำหรับห้องกระจกทิศตะวันตกและผู้ที่รักความเป็นส่วนตัวสูงสุด",
        tags: ["ความเป็นส่วนตัว", "สะท้อนความร้อนสูงสุด", "รับประกันตลอดอายุฟิล์ม"]
      };
    } else if (q2 === "glare" || q1 === "commercial") {
      film = {
        name: "Guardian Ceramic 35",
        series: "Guardian Series",
        vlt: "36%",
        irr: "92%",
        uvr: "99.9%",
        tser: "62%",
        accent: "กรองแสงจ้าสะท้อน & เย็นสบายสว่างนวลตา",
        description: "ฟิล์มนาโนเซรามิคสีชาร์โคลระดับความเข้มปานกลาง ช่วยลดแสงจ้าแยงตาในเวลากลางวันถึง 60% รักษาแสงธรรมชาติให้อบอุ่นสบายตา เหมาะอย่างยิ่งกับห้องทำงาน คอนโดมิเนียม และมุมพักผ่อนที่ต้องการความสบายสายตา",
        tags: ["ลดแสงสะท้อน", "เซรามิคพรีเมียม", "รับประกัน 10 ปี"]
      };
    } else {
      // เน้นกันความร้อนทั่วไป หรือรับแดดทิศตะวันออก
      if (q3 === "east-north") {
        film = {
          name: "Guardian Ceramic 70",
          series: "Guardian Series",
          vlt: "72%",
          irr: "88%",
          uvr: "99.9%",
          tser: "54%",
          accent: "ใสสว่างพิเศษ & สกัดความร้อนอินฟราเรดดีเยี่ยม",
          description: "ฟิล์มเซรามิคใสเกรดพรีเมียมที่ยอมให้แสงสว่างเข้าสูงถึง 72% ทำให้ห้องสว่างโล่งและดูกว้างขวางเหมือนไม่ได้ติดฟิล์ม แต่สกัดความร้อนอินฟราเรดได้สูงถึง 88% ช่วยรักษาทัศนียภาพตามธรรมชาติได้อย่างครบถ้วน",
          tags: ["ใสเคลียร์ระดับ HD", "แสงธรรมชาติผ่านสูง", "รับประกัน 10 ปี"]
        };
      } else {
        // แดดจัดปานกลาง/ทิศใต้ แนะนำรุ่นเกราะป้องกันสะท้อนความร้อน
        film = {
          name: "Apex Sputter 50",
          series: "Apex Series",
          vlt: "51%",
          irr: "95%",
          uvr: "99.9%",
          tser: "68%",
          accent: "ที่สุดของการสะท้อนแดดด้วยทองคำและโลหะมีค่า",
          description: "ฟิล์มสปัตเตอร์สุญญากาศความสว่างสากล ป้องกันความร้อนแดดด้วยฟิล์มสะท้อนโลหะชั้นเลิศระดับนาโนเมตร สกัดกั้นคลื่นอินฟราเรดสูง 95% มอบความเย็นสบายสูงสุดโดยไม่ทำให้ทัศนียภาพรอบข้างอึดอัด",
          tags: ["สปัตเตอร์หลายชั้น", "สะท้อนความร้อนขีดสุด", "กัน UV 100%"]
        };
      }
    }
    // GA4 Event for completed consultation result
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "view_search_results", {
        search_term: film.name,
        category: "film_selector_result"
      });
    }

    // Save recommendation to sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem("lg_recommended_film", film.name);
    }

    setRecommendedFilm(film);
    setStep(5);
  };

  const handleReset = () => {
    setAnswers({});
    setRecommendedFilm(null);
    setStep(1);
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline-variant/10 shadow-xl max-w-4xl mx-auto overflow-hidden relative">
      
      {/* Intro Step */}
      {step === 0 && (
        <div className="text-center space-y-6 max-w-xl mx-auto py-6">
          <div className="inline-block bg-primary/10 text-primary text-xs font-bold px-3.5 py-1 rounded-full font-headline uppercase tracking-wider">
            Smart Consultation Tool
          </div>
          <h3 className="text-3xl font-headline font-black text-on-surface">วิเคราะห์และเลือกรุ่นฟิล์มที่ใช่สำหรับคุณ</h3>
          <p className="text-on-surface-variant text-sm font-light leading-relaxed">
            ตอบคำถามสั้นๆ เพียง 3 ข้อเกี่ยวกับสถานที่ ปัญหาความร้อน และทิศทางแดด เพื่อให้ระบบอัจฉริยะประเมินรุ่นฟิล์มกรองแสง LUMAGUARD ที่ตอบโจทย์การประหยัดพลังงานและความสบายของคุณที่สุด
          </p>
          <div className="pt-4">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).gtag) {
                  (window as any).gtag("event", "start_consultation", {
                    step_name: "glass_selector"
                  });
                }
                setStep(1);
              }}
              className="bg-primary text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 mx-auto"
            >
              เริ่มต้นตอบคำถาม <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Question Steps */}
      {step >= 1 && step <= 3 && (
        <div className="space-y-8 animate-fade-in">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary font-headline">คำถามข้อที่ {step} จาก 3</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-primary" : "bg-outline-variant/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Title */}
          <div className="space-y-2">
            <h4 className="text-2xl font-headline font-extrabold text-on-surface">
              {questions[step - 1].title}
            </h4>
            <p className="text-on-surface-variant text-xs font-light">
              {questions[step - 1].subtitle}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {questions[step - 1].options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelectOption(option.value)}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15 text-left flex flex-col justify-between gap-4 hover:border-primary hover:shadow-lg active:scale-98 transition-all group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl">{option.icon}</span>
                  <span className="w-5 h-5 rounded-full border border-outline-variant/35 flex items-center justify-center group-hover:border-primary transition-all">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary transform scale-0 group-hover:scale-100 transition-transform" />
                  </span>
                </div>
                <div className="space-y-1">
                  <h5 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                    {option.label}
                  </h5>
                  <p className="text-on-surface-variant text-[11px] font-light leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Step */}
      {step === 4 && (
        <div className="text-center py-16 space-y-6">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-2xl">🧭</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-headline font-bold text-on-surface">กำลังวิเคราะห์ความเหมาะสมทางสเปก...</h4>
            <p className="text-on-surface-variant text-xs font-light">เรากำลังประมวลผลข้อมูลการลดความร้อนรวม (TSER) และการผ่านของแสงธรรมชาติ</p>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === 5 && recommendedFilm && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Left result details */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full font-headline uppercase tracking-wider">
                รุ่นที่แนะนำอัจฉริยะ (Recommended)
              </span>
              <div className="space-y-1">
                <h3 className="text-3xl font-headline font-black text-primary">{recommendedFilm.name}</h3>
                <span className="text-sm font-headline font-bold text-tertiary block">{recommendedFilm.accent}</span>
              </div>
              
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                {recommendedFilm.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {recommendedFilm.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full font-headline border border-outline-variant/10">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant/10">
              <a
                href="#contact"
                className="bg-primary text-on-primary px-6 py-3.5 rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                จองสำรวจประเมินราคารุ่นนี้ฟรี
              </a>
              <a
                href="https://line.me"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-headline font-bold text-xs active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                แชทปรึกษาฝ่ายเทคนิค LINE
              </a>
              <button
                onClick={handleReset}
                className="text-on-surface-variant hover:text-primary p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                title="ทำแบบทดสอบใหม่"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </button>
            </div>
          </div>

          {/* Right result specs card */}
          <div className="md:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15 flex flex-col justify-between shadow-inner">
            <div className="space-y-4">
              <h5 className="font-headline font-bold text-sm text-on-surface pb-3 border-b border-outline-variant/10">
                ข้อมูลประสิทธิภาพทางวิศวกรรม
              </h5>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-light">อัตราแสงธรรมชาติผ่าน (VLT)</span>
                  <span className="font-headline font-bold text-on-surface">{recommendedFilm.vlt}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-light">ป้องกันอินฟราเรด (IRR)</span>
                  <span className="font-headline font-bold text-on-surface" style={{ color: "#0ea5e9" }}>{recommendedFilm.irr}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-light">ป้องกันรังสี UV (UVR)</span>
                  <span className="font-headline font-bold text-on-surface">{recommendedFilm.uvr}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-light">การลดความร้อนรวม (TSER)</span>
                  <span className="font-headline font-black text-primary text-sm">{recommendedFilm.tser}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 text-[10px] text-primary leading-relaxed font-medium">
              💡 **คำแนะนำเชิงลึก**: ฟิล์มซีรีส์นี้เหมาะสำหรับท่านที่สุดจากข้อมูลการวิเคราะห์สภาพแดด ทิศทางกระจก และการป้องกันระดับสูงสุดของ LUMAGUARD
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
