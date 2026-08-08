"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id: ++toastId }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(kind: ToastKind, title: string, description?: string) {
  useToastStore.getState().push({ kind, title, description });
}

export const toastSuccess = (title: string, description?: string) => toast("success", title, description);
export const toastError = (title: string, description?: string) => toast("error", title, description);

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  React.useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), t.kind === "error" ? 6000 : 3800),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card/95 p-3.5 shadow-lift backdrop-blur",
            )}
            role="status"
          >
            {ICONS[t.kind]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
