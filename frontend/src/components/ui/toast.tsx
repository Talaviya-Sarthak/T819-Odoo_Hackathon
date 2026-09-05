import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  type: ToastType;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const toastTypeStyles: Record<
  ToastType,
  {
    container: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    defaultMessage: string;
  }
> = {
  success: {
    container: "bg-[#092518] border-[#15482e] text-zinc-100",
    icon: CheckCircle2,
    iconColor: "text-[#34d399]",
    defaultMessage: "This is a success message example!",
  },
  error: {
    container: "bg-[#2a0c0c] border-[#521616] text-zinc-100",
    icon: XCircle,
    iconColor: "text-[#f87171]",
    defaultMessage: "This is a error message example!",
  },
  warning: {
    container: "bg-[#2b1706] border-[#562e0c] text-zinc-100",
    icon: AlertCircle,
    iconColor: "text-[#fbbf24]",
    defaultMessage: "This is a warning message example!",
  },
  info: {
    container: "bg-[#171f45] border-[#2a3875] text-zinc-100",
    icon: Info,
    iconColor: "text-[#60a5fa]",
    defaultMessage: "This is a info message example!",
  },
};

/**
 * Toast component - exact match for the 4 design types: success, error, warning, info
 */
export function Toast({ type, message, onClose, className }: ToastProps) {
  const style = toastTypeStyles[type] || toastTypeStyles.info;
  const IconComponent = style.icon;
  const displayMessage = message || style.defaultMessage;

  return (
    <div
      className={cn(
        "flex items-center justify-between border rounded-2xl px-4 py-3.5 shadow-xl transition-all duration-200 min-w-[280px] max-w-md w-full",
        style.container,
        className
      )}
    >
      <div className="flex items-center gap-3 pr-4">
        <IconComponent className={cn("h-5 w-5 shrink-0 stroke-[1.75]", style.iconColor)} />
        <span className="text-sm font-medium tracking-wide text-zinc-100">{displayMessage}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close toast"
          className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-md shrink-0 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Global Toast Context & Provider for dynamic toasts
interface ToastItem {
  id: string;
  type: ToastType;
  message: React.ReactNode;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: React.ReactNode, duration?: number) => void;
    error: (message: React.ReactNode, duration?: number) => void;
    warning: (message: React.ReactNode, duration?: number) => void;
    info: (message: React.ReactNode, duration?: number) => void;
  };
  removeToast: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: React.ReactNode, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: React.ReactNode, duration?: number) => addToast("success", msg, duration),
    error: (msg: React.ReactNode, duration?: number) => addToast("error", msg, duration),
    warning: (msg: React.ReactNode, duration?: number) => addToast("warning", msg, duration),
    info: (msg: React.ReactNode, duration?: number) => addToast("info", msg, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
      {/* Floating toast container top-right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-in slide-in-from-top-3 fade-in duration-200">
            <Toast type={t.type} message={t.message} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
