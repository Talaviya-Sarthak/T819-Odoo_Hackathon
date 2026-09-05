import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  XOctagon, 
  Info, 
  X 
} from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'fail' | 'info';

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface ToastItemData {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastContextValue {
  toast: {
    (message: string, variant?: ToastVariant, options?: ToastOptions): void;
    success: (message: string, titleOrOptions?: string | ToastOptions) => void;
    error: (message: string, titleOrOptions?: string | ToastOptions) => void;
    warning: (message: string, titleOrOptions?: string | ToastOptions) => void;
    fail: (message: string, titleOrOptions?: string | ToastOptions) => void;
    info: (message: string, titleOrOptions?: string | ToastOptions) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CONFIGS = {
  success: {
    defaultTitle: 'Success',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  error: {
    defaultTitle: 'Error',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
  },
  warning: {
    defaultTitle: 'Warning',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  fail: {
    defaultTitle: 'Action Failed',
    icon: XOctagon,
    iconColor: 'text-red-400',
  },
  info: {
    defaultTitle: 'Notice',
    icon: Info,
    iconColor: 'text-sky-400',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);

  const addToast = useCallback((
    message: string, 
    variant: ToastVariant = 'info', 
    options?: ToastOptions
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options?.duration || 4000;
    const title = options?.title;

    setToasts((prev) => [...prev, { id, message, variant, duration, title }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastFn: any = (message: string, variant: ToastVariant = 'info', options?: ToastOptions) => {
    addToast(message, variant, options);
  };

  toastFn.success = (message: string, titleOrOptions?: string | ToastOptions) => {
    const opts = typeof titleOrOptions === 'string' ? { title: titleOrOptions } : titleOrOptions;
    addToast(message, 'success', opts);
  };

  toastFn.error = (message: string, titleOrOptions?: string | ToastOptions) => {
    const opts = typeof titleOrOptions === 'string' ? { title: titleOrOptions } : titleOrOptions;
    addToast(message, 'error', opts);
  };

  toastFn.warning = (message: string, titleOrOptions?: string | ToastOptions) => {
    const opts = typeof titleOrOptions === 'string' ? { title: titleOrOptions } : titleOrOptions;
    addToast(message, 'warning', opts);
  };

  toastFn.fail = (message: string, titleOrOptions?: string | ToastOptions) => {
    const opts = typeof titleOrOptions === 'string' ? { title: titleOrOptions } : titleOrOptions;
    addToast(message, 'fail', opts);
  };

  toastFn.info = (message: string, titleOrOptions?: string | ToastOptions) => {
    const opts = typeof titleOrOptions === 'string' ? { title: titleOrOptions } : titleOrOptions;
    addToast(message, 'info', opts);
  };

  return (
    <ToastContext.Provider value={{ toast: toastFn }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none items-end max-w-sm sm:max-w-md w-full">
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <SlimMinimalToastItem key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function SlimMinimalToastItem({ item, onDismiss }: { item: ToastItemData; onDismiss: () => void }) {
  const config = VARIANT_CONFIGS[item.variant] || VARIANT_CONFIGS.info;
  const Icon = config.icon;
  const displayTitle = item.title || config.defaultTitle;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto relative flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#161820]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-md min-w-[280px] max-w-[380px] select-none"
    >
      {/* Bare circular outlined icon matching user reference */}
      <Icon className={`h-4 w-4 shrink-0 mt-[2px] ${config.iconColor}`} strokeWidth={2} />

      {/* Title & Subtitle */}
      <div className="flex flex-col flex-1 min-w-0 pr-1">
        <span className="text-[13px] font-semibold text-white tracking-tight leading-snug">
          {displayTitle}
        </span>
        {item.message && (
          <span className="text-[12px] text-zinc-400 font-normal leading-relaxed mt-0.5 break-words">
            {item.message}
          </span>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5 rounded cursor-pointer shrink-0 -mr-1 -mt-0.5"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  const toastObj = context.toast as any;
  toastObj.toast = context.toast;
  return toastObj;
}

