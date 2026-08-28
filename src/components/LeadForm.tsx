"use client";

import { useState, type FormEvent } from "react";
import { CAR_BRANDS } from "@/lib/carPrices";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { getTrafficSourceData } from "@/lib/utmTracker";

/**
 * tone="sky" ใช้เมื่อวางฟอร์มต่อจากกล่อง CTA ในบทความ เพื่อให้โทนสีต่อเนื่องกัน
 * ค่าเริ่มต้นคงสีเดิมไว้ เพราะฟอร์มนี้ถูกใช้ในอีกสามหน้าที่พื้นหลังต่างกัน
 */
/** อ่าน client id ของ GA4 จากคุกกี้ _ga ซึ่งมีรูปแบบ GA1.1.<id ส่วนที่ 1>.<ส่วนที่ 2> */
function readGaClientId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(/_ga=([^;]+)/);
  if (!m) return undefined;
  const parts = m[1].split(".");
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : undefined;
}

interface LeadFormProps {
  tone?: "default" | "sky";
  /**
   * ชนิดงานที่ฟอร์มนี้รับ
   *
   * งานอาคารต้องรู้เขตพื้นที่เพื่อนัดเข้าวัดหน้างาน ส่วนงานรถต้องรู้ยี่ห้อกับรุ่น
   * เพราะราคาคิดตามขนาดรถ ถามครบทุกช่องทั้งสองแบบจะกลายเป็นฟอร์มยาวที่คนกรอกไม่จบ
   */
  variant?: "building" | "car";
}

export default function LeadForm({ tone = "default", variant = "building" }: LeadFormProps) {
  const sky = tone === "sky";
  const isCar = variant === "car";

  const shellClass = sky
    ? "bg-accent-50/70 p-6 sm:p-8 md:p-10 rounded-2xl border border-accent-200 relative overflow-hidden max-w-4xl mx-auto"
    : "bg-white p-6 sm:p-8 md:p-12 rounded-3xl border border-slate-200/80 shadow-xl relative overflow-hidden max-w-4xl mx-auto";

  // บนพื้นฟ้า ช่องกรอกต้องเป็นสีขาวถึงจะแยกออกจากพื้นหลัง
  const fieldClass = sky
    ? "w-full bg-white text-slate-900 border border-accent-200 rounded-xl px-4 sm:px-5 py-3.5 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 transition-all disabled:opacity-50 text-sm"
    : "w-full bg-slate-100 text-slate-900 border border-slate-200/80 rounded-xl px-4 sm:px-5 py-3.5 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all disabled:opacity-50 text-sm";

  // ปุ่มหลักให้ตรงกับปุ่ม "ขอใบเสนอราคาฟรี" ในกล่อง CTA
  const submitClass = sky
    ? "w-full bg-primary hover:opacity-90 text-on-primary py-4 rounded-xl font-headline font-bold text-sm sm:text-base transition-all flex justify-center items-center gap-2 disabled:opacity-60"
    : "w-full bg-primary hover:opacity-90 text-on-primary py-4 rounded-xl font-headline font-bold text-sm sm:text-base transition-all flex justify-center items-center gap-2 disabled:opacity-60";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    district: "",
    propertyType: "Condo",
    areaSize: "",
    carBrand: "",
    carModel: "",
  });
  /**
   * ยี่ห้อเลือกจากรายการ แต่ยังพิมพ์เองได้เมื่อไม่มีในรายการ
   *
   * ถ้าบังคับเลือกอย่างเดียว รถที่รายการยังไม่ครอบคลุมจะกรอกฟอร์มไม่ได้เลย
   * ซึ่งแปลว่าเสียลีดไปฟรี ๆ ตัวเลือก "อื่น ๆ" จึงต้องมีเสมอ
   *
   * ส่วนรุ่นเป็นช่องพิมพ์ ไม่ได้ทำเป็นรายการให้เลือก เพราะชื่อรุ่นในตลาดไทย
   * เปลี่ยนเร็วและมีเป็นร้อยชื่อ รายการที่ดูแลไม่ทันจะกลายเป็นอุปสรรคมากกว่าตัวช่วย
   */
  const [brandIsOther, setBrandIsOther] = useState(false);
  const OTHER = "__other__";

  const handleBrandChange = (value: string) => {
    const other = value === OTHER;
    setBrandIsOther(other);
    setFormData({ ...formData, carBrand: other ? "" : value });
  };

  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const missing = !formData.name || !formData.phone
      || (isCar ? !formData.carBrand || !formData.carModel : !formData.district);
    if (missing) {
      setStatus("error");
      setErrorMessage(
        isCar
          ? "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, เบอร์โทร, ยี่ห้อรถ, รุ่นรถ)"
          : "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, เบอร์โทร, เขตพื้นที่)",
      );
      return;
    }

    const marketingData = getTrafficSourceData();
    let estimatedArea: number | null = null;
    let recommendedFilm: string | null = null;

    if (typeof window !== "undefined" && window.sessionStorage) {
      const savedArea = window.sessionStorage.getItem("lg_estimated_area");
      if (savedArea) {
        estimatedArea = parseFloat(savedArea);
      }
      recommendedFilm = window.sessionStorage.getItem("lg_recommended_film");
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          leadType: variant,
          // ไม่ส่งช่องของอีกฝั่งไปด้วย ไม่งั้นลีดงานรถจะมี propertyType ติดไป
          // แล้วในหลังบ้านจะดูเหมือนงานคอนโดทั้งที่เป็นงานรถ
          // ส่วนเขตพื้นที่ใช้ร่วมกันได้ งานรถก็ต้องรู้ว่าจะขับไปที่ไหน
          district: formData.district || null,
          propertyType: isCar ? null : formData.propertyType,
          carBrand: isCar ? formData.carBrand : null,
          carModel: isCar ? formData.carModel : null,
          areaSize: isCar || !formData.areaSize ? null : parseFloat(formData.areaSize),
          estimatedArea,
          recommendedFilm,
          // ส่ง client id ของ GA4 ไปด้วย เพื่อให้ event ที่ยิงจากเซิร์ฟเวอร์
          // ผูกกับ session เดียวกับที่ผู้ใช้เข้าชม ไม่งั้น GA4 จะนับเป็นคนละคน
          // และบอกไม่ได้ว่าลูกค้ารายนี้มาจากช่องทางไหน
          gaClientId: readGaClientId(),
          ...marketingData
        }),
      });

      if (!res.ok) {
        // เดิมแสดงข้อความเดียวกันหมดไม่ว่าจะล้มเหลวด้วยสาเหตุใด ทำให้ผู้ใช้
        // ไม่รู้ว่าควรทำอะไรต่อ และเราก็หาสาเหตุไม่ได้เพราะไม่มีข้อมูลอะไรเลย
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error ?? "";
        } catch {
          /* บางกรณีปลายทางไม่ได้ตอบเป็น JSON */
        }

        if (res.status === 429) {
          throw new Error(detail || "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่");
        }
        if (res.status === 400) {
          throw new Error(detail || "ข้อมูลไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        }
        throw new Error(
          `ส่งข้อมูลไม่สำเร็จ (รหัส ${res.status}) กรุณาลองใหม่ หรือติดต่อเราทาง LINE`,
        );
      }

      // GA4 Event Tracking for Lead Submission
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "generate_lead", {
          form_id: "lead_form",
          property_type: formData.propertyType,
          value: 1
        });
      }

      setStatus("success");
      setFormData({
        name: "",
        phone: "",
        district: "",
        propertyType: "Condo",
        areaSize: "",
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "เกิดข้อผิดพลาดบางอย่าง");
    }
  };

  return (
    <div className={shellClass}>
      <h3 className="text-xl sm:text-2xl font-headline font-extrabold mb-6 text-slate-900 tracking-tight text-center md:text-left">
        จองบริการสำรวจวัดขนาดพื้นที่ฟรี
      </h3>

      {status === "success" ? (
        <div className="bg-accent-50 border border-accent-200 p-8 rounded-2xl text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-accent-700 mx-auto" />
          <h4 className="text-lg font-bold font-headline text-slate-900">ส่งคำขอเสร็จสมบูรณ์!</h4>
          <p className="text-slate-600 text-sm font-light">
            ขอบคุณสำหรับความสนใจ เจ้าหน้าที่ผู้เชี่ยวชาญจะติดต่อกลับเพื่อประเมินราคาและยืนยันนัดหมายทางโทรศัพท์โดยเร็วที่สุด
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold font-headline text-sm hover:bg-accent-700 transition-colors shadow-sm"
          >
            ส่งคำขอใหม่
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === "error" && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label htmlFor="lead-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ชื่อ-นามสกุล *
              </label>
              <input
                type="text"
                required
                id="lead-name"
                autoComplete="name"
                placeholder="ระบุชื่อของคุณ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                เบอร์โทรศัพท์ติดต่อ *
              </label>
              <input
                type="tel"
                required
                id="lead-phone"
                autoComplete="tel"
                placeholder="08X-XXX-XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>

            {isCar ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="lead-car-brand" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ยี่ห้อรถ *
                  </label>
                  <select
                    id="lead-car-brand"
                    value={brandIsOther ? OTHER : formData.carBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    disabled={status === "submitting"}
                    className={fieldClass}
                  >
                    <option value="">— เลือกยี่ห้อ —</option>
                    {CAR_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                    <option value={OTHER}>อื่น ๆ (พิมพ์เอง)</option>
                  </select>
                  {brandIsOther && (
                    <input
                      type="text"
                      aria-label="พิมพ์ยี่ห้อรถ"
                      placeholder="พิมพ์ยี่ห้อรถ"
                      value={formData.carBrand}
                      onChange={(e) => setFormData({ ...formData, carBrand: e.target.value })}
                      disabled={status === "submitting"}
                      className={fieldClass}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lead-car-model" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    รุ่นรถ *
                  </label>
                  <input
                    type="text"
                    required
                    id="lead-car-model"
                    placeholder="เช่น Yaris Ativ, CR-V, D-Max Cab"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    disabled={status === "submitting"}
                    className={fieldClass}
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ใช้ประเมินขนาดรถเพื่อเสนอราคาเหมาทั้งคัน
                  </p>
                </div>

                {/*
                  งานรถเป็นบริการไปติดถึงที่ ทีมงานต้องรู้ว่าจะไปที่ไหน
                  แต่ไม่บังคับ เพราะคนที่แค่อยากรู้ราคายังไม่จำเป็นต้องบอกที่อยู่
                  และการเพิ่มช่องบังคับทุกช่องคือวิธีทำให้คนกรอกไม่จบ
                */}
                <div className="space-y-2">
                  <label htmlFor="lead-car-district" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    เขต / อำเภอ ที่ให้เข้าไปติดตั้ง
                  </label>
                  <input
                    type="text"
                    id="lead-car-district"
                    autoComplete="address-level2"
                    placeholder="เช่น หลักสี่, บางนา (ไม่บังคับ)"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    disabled={status === "submitting"}
                    className={fieldClass}
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    เราเข้าไปติดตั้งถึงที่ — แจ้งไว้ล่วงหน้าจะนัดคิวได้เร็วขึ้น
                  </p>
                </div>
              </>
            ) : (
              <>
            <div className="space-y-2">
              <label htmlFor="lead-district" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                เขต / อำเภอ (ที่ตั้งอาคาร) *
              </label>
              <input
                type="text"
                required
                id="lead-district"
                autoComplete="address-level2"
                placeholder="เช่น วัฒนา, บางนา"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-property-type" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ประเภทสิ่งปลูกสร้าง
              </label>
              <select
                id="lead-property-type"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              >
                <option value="Condo">คอนโดมิเนียม</option>
                <option value="House">บ้านเดี่ยว / ทาวน์โฮม</option>
                <option value="Office">สำนักงาน / ออฟฟิศ</option>
                <option value="Commercial">ร้านค้า / อาคารพาณิชย์</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="lead-area-size" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                พื้นที่กระจกโดยประมาณ (ตร.ฟุต)
              </label>
              <input
                type="number"
                id="lead-area-size"
                placeholder="เช่น 30, 150"
                value={formData.areaSize}
                onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                disabled={status === "submitting"}
                className={fieldClass}
              />
            </div>
              </>
            )}
          </div>

          {/*
            PDPA กำหนดให้ขอความยินยอมอย่างชัดแจ้งก่อนเก็บข้อมูลส่วนบุคคล
            และห้ามติ๊กมาให้ล่วงหน้า ผู้ใช้ต้องเป็นคนกดเอง
          */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="lead-consent"
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === "submitting"}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/30"
            />
            <label htmlFor="lead-consent" className="text-xs leading-relaxed text-slate-600">
              ข้าพเจ้ายินยอมให้ LUMAGUARD เก็บและใช้ข้อมูลที่กรอกไว้
              เพื่อติดต่อกลับและเสนอราคา ตามที่ระบุใน{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener"
                className="font-semibold text-primary underline underline-offset-2"
              >
                นโยบายความเป็นส่วนตัว
              </a>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "submitting" || !consent}
              className={submitClass}
            >
              {status === "submitting" ? "กำลังประมวลผล..." : "ส่งข้อมูลและขอนัดหมายสำรวจพื้นที่"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
