"use client";

import { ShieldAlert, Info } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/10 pt-16 pb-8 font-body">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
        {/* Column 1: Info */}
        <div className="space-y-6">
          <div className="text-2xl font-black text-primary font-headline tracking-tighter">
            LUMAGUARD
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            ผู้ให้บริการฟิล์มกรองแสงระดับพรีเมียมในกรุงเทพฯ เราเชี่ยวชาญการติดตั้งฟิล์มกรองแสงกันความร้อนสูงและปกป้องรังสี UV สำหรับอาคาร คอนโดมิเนียม และบ้านพักอาศัย
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-primary mb-6">
            เมนูด่วน
          </h2>
          <ul className="space-y-4 font-medium text-on-surface-variant">
            <li>
              <a href="/products" className="hover:text-primary transition-colors">
                สินค้า & เปรียบเทียบ
              </a>
            </li>
            <li>
              <a href="/portfolio" className="hover:text-primary transition-colors">
                ผลงานการติดตั้ง
              </a>
            </li>
            <li>
              <a href="/services" className="hover:text-primary transition-colors">
                ขั้นตอน & บริการ
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-primary transition-colors">
                ติดต่อรับคำแนะนำฟรี
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Resources */}
        <div>
          <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-primary mb-6">
            ข้อมูล & เอกสาร
          </h2>
          <ul className="space-y-4 font-medium text-on-surface-variant">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                นโยบายความเป็นส่วนตัว
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                เงื่อนไขการใช้บริการ
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                ใบรับรองมาตรฐานฟิล์ม
              </a>
            </li>
            <li>
              <a href="/blog" className="hover:text-primary transition-colors">
                บทความ & สาระน่ารู้
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: HQ Office */}
        <div>
          <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-primary mb-6">
            สำนักงานใหญ่
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            หลักสี่ กรุงเทพฯ
          </p>
          <p className="text-on-surface-variant leading-relaxed font-bold space-y-1">
            <a 
              href="tel:0983539369" 
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).gtag) {
                  (window as any).gtag("event", "contact_click", { method: "phone", placement: "footer" });
                }
              }}
              className="hover:text-primary transition-colors block"
            >
              โทร: 098-353-9369
            </a>
            <a 
              href="https://line.me/R/ti/p/@LUMAGUARD" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).gtag) {
                  (window as any).gtag("event", "contact_click", { method: "line", placement: "footer" });
                }
              }}
              className="hover:text-primary transition-colors block"
            >
              LINE OA: @LUMAGUARD
            </a>
          </p>        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
        <p>© {new Date().getFullYear()} LUMAGUARD Window Film. สงวนลิขสิทธิ์ทั้งหมด.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
        </div>
        <div className="flex gap-4 text-on-surface-variant/40">
          <ShieldAlert className="w-5 h-5" />
          <Info className="w-5 h-5" />
        </div>
      </div>
    </footer>
  );
}
