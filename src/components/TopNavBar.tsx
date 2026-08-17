"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import SearchDialog from "@/components/SearchDialog";
import { initializeTrafficSourceTracker } from "@/lib/utmTracker";

export default function TopNavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    initializeTrafficSourceTracker();
  }, []);

  const navLinks = [
    { name: "หน้าหลัก", href: "/" },
    { name: "สินค้า & เปรียบเทียบ", href: "/products" },
    { name: "ขั้นตอน & บริการ", href: "/services" },
    { name: "ผลงาน", href: "/portfolio" },
    { name: "ติดต่อเรา & FAQ", href: "/contact" },
    { name: "บล็อก", href: "/blog" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/70 dark:bg-on-background/70 backdrop-blur-xl transition-all duration-300 border-b border-outline-variant/10 shadow-[0_20px_40px_rgba(25,28,29,0.02)]">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
        {/* Brand Logo */}
        <a href="/" className="text-2xl font-black text-primary tracking-tighter font-headline">
          LUMAGUARD
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-headline font-bold text-sm tracking-tight">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`transition-colors py-1 ${
                isActive(link.href)
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <SearchDialog />
          <a
            href="/contact"
            onClick={() => {
              if (typeof window !== "undefined" && (window as any).gtag) {
                (window as any).gtag("event", "contact_click", { method: "web_form", placement: "header" });
              }
            }}
            className="bg-tertiary-container text-on-tertiary px-6 py-2.5 rounded-full font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md shadow-tertiary-container/10"
          >
            ติดต่อรับคำแนะนำฟรี
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-4">
          <SearchDialog />
          <button
            type="button"
            aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface p-2 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-surface/95 border-b border-outline-variant/10 px-6 py-8 space-y-4 animate-fade-in">
          <div className="flex flex-col space-y-4 font-headline font-bold text-lg">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 ${
                  isActive(link.href)
                    ? "text-primary border-l-4 border-primary pl-3"
                    : "text-on-surface-variant pl-3"
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-outline-variant/10">
            <a
              href="/contact"
              onClick={() => {
                setMobileMenuOpen(false);
                if (typeof window !== "undefined" && (window as any).gtag) {
                  (window as any).gtag("event", "contact_click", { method: "web_form", placement: "header_mobile" });
                }
              }}
              className="block text-center w-full bg-tertiary-container text-on-tertiary py-3.5 rounded-xl font-headline font-bold shadow-lg"
            >
              ติดต่อรับคำแนะนำฟรี
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
