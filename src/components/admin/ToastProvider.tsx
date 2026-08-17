"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

type ToastKind = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  duration: number;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string, duration = 4000) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, kind, message, duration }]);
    },
    []
  );

  const value: ToastContextValue = {
    toast,
    success: (m, d) => toast("success", m, d),
    error: (m, d) => toast("error", m, d ?? 6000),
    info: (m, d) => toast("info", m, d),
    warning: (m, d) => toast("warning", m, d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[100] bottom-6 right-6 flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] sm:w-96 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onDismiss, 200);
    return () => clearTimeout(timer);
  }, [leaving, onDismiss]);

  const styles: Record<ToastKind, { bg: string; text: string; border: string; Icon: typeof CheckCircle2 }> = {
    success: {
      bg: "bg-white",
      text: "text-emerald-800",
      border: "border-l-4 border-emerald-500",
      Icon: CheckCircle2,
    },
    error: {
      bg: "bg-white",
      text: "text-red-800",
      border: "border-l-4 border-red-500",
      Icon: AlertCircle,
    },
    info: {
      bg: "bg-white",
      text: "text-blue-800",
      border: "border-l-4 border-blue-500",
      Icon: Info,
    },
    warning: {
      bg: "bg-white",
      text: "text-amber-800",
      border: "border-l-4 border-amber-500",
      Icon: AlertTriangle,
    },
  };
  const { bg, text, border, Icon } = styles[toast.kind];

  return (
    <div
      role="status"
      className={`pointer-events-auto ${bg} ${border} rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 transition-all duration-200 ${
        leaving ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${text}`} />
      <p className={`flex-grow text-xs font-semibold leading-relaxed ${text}`}>{toast.message}</p>
      <button
        onClick={() => setLeaving(true)}
        className="shrink-0 p-1 rounded-md hover:bg-black/5 text-on-surface-variant/70 transition-colors"
        aria-label="ปิดการแจ้งเตือน"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>. Wrap admin layout with it.");
  }
  return ctx;
}
