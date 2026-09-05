import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogueProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  features?: string[];
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Dialogue({
  isOpen,
  onClose,
  title = "Beautiful Modal",
  description = "This is a beautiful animated modal with smooth entrance and exit animations. Click outside or press Escape to close.",
  features = [
    "Smooth animations",
    "Backdrop blur effect",
    "Responsive design",
    "Keyboard navigation (ESC to close)",
  ],
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  className,
  children,
}: DialogueProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md bg-[#0a0a0c] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200 text-zinc-100",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-lg focus:outline-none"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Custom children or default content */}
        {children ? (
          children
        ) : (
          <div className="space-y-4 text-sm text-zinc-300">
            <p className="leading-relaxed font-normal">{description}</p>

            {features && features.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="font-semibold text-zinc-200 text-sm">Features:</p>
                <ul className="space-y-1.5 pl-1">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-colors focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors focus:outline-none"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
