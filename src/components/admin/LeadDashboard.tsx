"use client";

import { useState } from "react";
import {
  User, Phone, MapPin, Building, Square, Calendar,
  Archive, Check, X, Target, BarChart2, ArrowRight,
  Clock, ShieldAlert, FileText, Globe, Inbox
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface Lead {
  id: string;
  name: string;
  phone: string;
  district: string;
  propertyType: string;
  areaSize: number | null;
  status: string;
  createdAt: Date;
  estimatedArea?: number | null;
  recommendedFilm?: string | null;
  trafficSource?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  landingPage?: string | null;
}

interface LeadDashboardProps {
  initialLeads: Lead[];
}

export default function LeadDashboard({ initialLeads }: LeadDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filter, setFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const toast = useToast();

  const filteredLeads = leads.filter((lead) => {
    if (filter === "all") return true;
    return lead.status === filter;
  });

  const statusLabel = (s: string) =>
    s === "new" ? "รอดำเนินการ" : s === "contacted" ? "ติดต่อแล้ว" : "เก็บถาวร";

  const updateLeadStatus = async (id: string, newStatus: string) => {
    if (updatingId) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
        );
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        toast.success(`อัปเดตสถานะเป็น "${statusLabel(newStatus)}" เรียบร้อย`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบเครือข่ายและลองใหม่");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-headline font-black text-on-surface">ระบบคุมยอด Lead & ลูกค้าสนใจ</h1>
          <p className="text-xs text-on-surface-variant font-light mt-0.5">
            ติดตามข้อมูลติดต่อ และเส้นทางความต้องการของลูกค้า (Customer Journey) เพื่อส่งต่อข้อมูลให้ทีมขาย
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex bg-surface-container-high p-1 rounded-xl self-start sm:self-auto font-headline font-bold text-xs">
          {["all", "new", "contacted", "archived"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === s
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {s === "all" ? "ทั้งหมด" : s === "new" ? "รอดำเนินการ" : s === "contacted" ? "ติดต่อแล้ว" : "เก็บถาวร"}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Layout */}
      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl overflow-hidden shadow-sm">
        {filteredLeads.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Inbox className="w-14 h-14 text-on-surface-variant/30 mx-auto" />
            <p className="text-sm font-bold text-on-surface">
              {filter === "all"
                ? "ยังไม่มีรายชื่อ Lead ในระบบ"
                : `ไม่มี Lead ในสถานะ "${statusLabel(filter)}"`}
            </p>
            <p className="text-xs text-on-surface-variant font-light max-w-sm mx-auto">
              {filter === "all"
                ? "Lead ใหม่จะปรากฏที่นี่โดยอัตโนมัติเมื่อลูกค้ากรอกฟอร์มบนหน้าเว็บ"
                : "ลองเปลี่ยนตัวกรองด้านบน หรือรอจนกว่าจะมี Lead ในหมวดหมู่นี้"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10">
                  <th className="p-5">วันที่ลงทะเบียน</th>
                  <th className="p-5">ชื่อ-นามสกุล</th>
                  <th className="p-5">เบอร์โทรศัพท์</th>
                  <th className="p-5">เขตพื้นที่</th>
                  <th className="p-5 text-center">ช่องทางการตลาด</th>
                  <th className="p-5 text-center">สถานะ</th>
                  <th className="p-5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs font-medium text-on-surface">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-surface-container-low/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="p-5 text-on-surface-variant/70 font-light font-mono">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="p-5 font-bold font-headline">{lead.name}</td>
                    <td className="p-5 font-mono text-on-surface-variant">{lead.phone}</td>
                    <td className="p-5 text-on-surface-variant">{lead.district}</td>
                    <td className="p-5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          lead.trafficSource === "Google Ads"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : lead.trafficSource === "Google Organic"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : lead.trafficSource === "Social Media"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {lead.trafficSource || "Direct"}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          lead.status === "new"
                            ? "bg-tertiary/10 text-tertiary"
                            : lead.status === "contacted"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {lead.status === "new"
                          ? "รอดำเนินการ"
                          : lead.status === "contacted"
                          ? "ติดต่อแล้ว"
                          : "เก็บถาวร"}
                      </span>
                    </td>
                    <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-headline font-bold transition-all"
                        >
                          ดูรายละเอียด
                        </button>
                        {lead.status === "new" && (
                          <button
                            onClick={() => updateLeadStatus(lead.id, "contacted")}
                            disabled={updatingId === lead.id}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="ทำเครื่องหมายว่าติดต่อแล้ว"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Journey & Details Modal Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end p-0 md:p-4">
          <div className="w-full max-w-4xl h-full md:h-[90vh] bg-surface-container-lowest border-l md:border border-outline-variant/15 md:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in relative">
            
            {/* Drawer Header */}
            <div className="p-6 bg-surface-container-high/40 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-headline block">Customer Info & Analytics</span>
                <h3 className="text-xl font-bold font-headline text-on-surface flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> {selectedLead.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Area (Split into Info vs Journey) */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 divide-y md:divide-y-0 md:divide-x divide-outline-variant/15">
              
              {/* Left Column: Basic Contact & CRM status (5 cols) */}
              <div className="md:col-span-5 space-y-6 flex flex-col justify-between h-full pr-0 md:pr-4">
                <div className="space-y-6">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> ข้อมูลสำหรับการติดต่อ
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-1">
                      <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">เบอร์โทรศัพท์ลูกค้า</span>
                      <a href={`tel:${selectedLead.phone}`} className="text-base font-bold text-primary font-mono hover:underline flex items-center gap-1">
                        <Phone className="w-4 h-4 shrink-0" /> {selectedLead.phone}
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-1">
                        <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">ประเภทอสังหาฯ</span>
                        <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-primary shrink-0" />
                          {selectedLead.propertyType === "Condo"
                            ? "คอนโดมิเนียม"
                            : selectedLead.propertyType === "House"
                            ? "บ้านเดี่ยว/ทาวน์โฮม"
                            : selectedLead.propertyType === "Office"
                            ? "สำนักงาน"
                            : "ร้านค้า/พาณิชย์"}
                        </span>
                      </div>
                      
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-1">
                        <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">เขตพื้นที่ติดตั้ง</span>
                        <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary shrink-0" /> เขต {selectedLead.district}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedLead.areaSize && (
                        <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-1">
                          <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">พื้นที่หน้างาน (ตร.ฟุต)</span>
                          <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                            <Square className="w-4 h-4 text-primary shrink-0" /> {selectedLead.areaSize} ตร.ฟุต
                          </span>
                        </div>
                      )}
                      
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-1">
                        <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">ลงทะเบียนเมื่อ</span>
                        <span className="text-[11px] font-bold text-on-surface flex items-center gap-1.5 font-mono">
                          <Clock className="w-4 h-4 text-primary shrink-0" /> {formatDate(selectedLead.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status modifier buttons */}
                <div className="space-y-3 pt-6 border-t border-outline-variant/10 mt-6">
                  <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase mb-1">ปรับเปลี่ยนสถานะของ Lead</span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => updateLeadStatus(selectedLead.id, "new")}
                      disabled={updatingId === selectedLead.id}
                      className={`flex-grow py-2.5 px-3 rounded-xl text-xs font-headline font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedLead.status === "new"
                          ? "bg-tertiary/15 text-tertiary border-tertiary/20 shadow-sm"
                          : "bg-transparent text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low"
                      }`}
                    >
                      รอดำเนินการ
                    </button>
                    <button
                      onClick={() => updateLeadStatus(selectedLead.id, "contacted")}
                      disabled={updatingId === selectedLead.id}
                      className={`flex-grow py-2.5 px-3 rounded-xl text-xs font-headline font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedLead.status === "contacted"
                          ? "bg-primary/15 text-primary border-primary/20 shadow-sm"
                          : "bg-transparent text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low"
                      }`}
                    >
                      ติดต่อแล้ว
                    </button>
                    <button
                      onClick={() => updateLeadStatus(selectedLead.id, "archived")}
                      disabled={updatingId === selectedLead.id}
                      className={`flex-grow py-2.5 px-3 rounded-xl text-xs font-headline font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedLead.status === "archived"
                          ? "bg-surface-container-highest text-on-surface border-outline-variant/20"
                          : "bg-transparent text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low hover:text-error"
                      }`}
                    >
                      เก็บถาวร
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Web Journey & GA4 (7 cols) */}
              <div className="md:col-span-7 space-y-6 pt-6 md:pt-0 pl-0 md:pl-8">
                <h4 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" /> ประวัติการเดินทางลูกค้า (Customer Journey)
                </h4>

                <div className="space-y-4">
                  {/* Traffic source detail */}
                  <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase">ช่องทางที่มา (Traffic Source)</span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedLead.trafficSource === "Google Ads"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse"
                            : selectedLead.trafficSource === "Google Organic"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : selectedLead.trafficSource === "Social Media"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {selectedLead.trafficSource || "Direct"}
                      </span>
                    </div>

                    {/* Landing Page Path ( indirect SEO Keyword indicator ) */}
                    <div className="space-y-1 border-t border-outline-variant/10 pt-3">
                      <span className="block text-[9px] text-on-surface-variant/60 font-bold uppercase flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-primary" /> หน้าแรกเข้า (Landing Page - บ่งชี้คีย์เวิร์ดทางอ้อม)
                      </span>
                      <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 text-[11px] font-mono text-primary font-bold overflow-x-auto truncate">
                        {selectedLead.landingPage || "/"}
                      </div>
                    </div>
                  </div>

                  {/* Customer behavior pricing and selector */}
                  <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-4">
                    <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">ความสนใจและพฤติกรรมบนเว็บ (On-Site Behavior)</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Price calculation logs */}
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 space-y-1">
                        <span className="block text-[9px] text-on-surface-variant/60 font-bold uppercase">📐 ขนาดพื้นที่คำนวณราคา</span>
                        <span className="text-sm font-black text-on-surface">
                          {selectedLead.estimatedArea ? `${selectedLead.estimatedArea} ตร.ฟุต` : "ไม่ได้ประเมินราคา"}
                        </span>
                      </div>

                      {/* Film selector result logs */}
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 space-y-1">
                        <span className="block text-[9px] text-on-surface-variant/60 font-bold uppercase">💡 ฟิล์มที่ได้รับแนะนำ</span>
                        <span className="text-sm font-black text-primary truncate block" title={selectedLead.recommendedFilm || ""}>
                          {selectedLead.recommendedFilm || "ไม่ได้ทำแบบสอบถาม"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* UTM Parameters & Campaign detailed stats */}
                  <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-3">
                    <span className="block text-[10px] text-on-surface-variant/60 font-bold uppercase">พารามิเตอร์การตลาด (UTM Parameters)</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-on-surface-variant/60 font-bold uppercase">
                      <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 space-y-1">
                        <span>utm_source</span>
                        <span className="block text-on-surface font-bold text-xs truncate mt-0.5">{selectedLead.utmSource || "-"}</span>
                      </div>
                      <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 space-y-1">
                        <span>utm_medium</span>
                        <span className="block text-on-surface font-bold text-xs truncate mt-0.5">{selectedLead.utmMedium || "-"}</span>
                      </div>
                      <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 space-y-1">
                        <span>utm_campaign</span>
                        <span className="block text-on-surface font-bold text-xs truncate mt-0.5" title={selectedLead.utmCampaign || ""}>{selectedLead.utmCampaign || "-"}</span>
                      </div>
                    </div>

                    {/* Google Ads Click ID */}
                    {selectedLead.gclid && (
                      <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 space-y-1.5 mt-2">
                        <span className="text-[9px] text-on-surface-variant/60 font-bold uppercase flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-primary" /> Google Click ID (GCLID)
                        </span>
                        <span className="block text-[10px] font-mono text-on-surface bg-surface-container-low px-2 py-1 rounded truncate">
                          {selectedLead.gclid}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-surface-container-high/40 border-t border-outline-variant/10 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-on-surface-variant/60 font-light">ID: {selectedLead.id}</span>
              <button 
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
