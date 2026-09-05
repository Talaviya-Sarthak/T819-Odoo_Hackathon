import React from 'react';
import type { ButtonProps } from '../types';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  loading,
  className = ''
}: ButtonProps) {
  const baseStyles = 'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50';
  const variantStyles = variant === 'primary'
    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]'
    : 'border border-border/60 bg-card text-foreground hover:bg-white/5 active:scale-[0.98]';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${className}`.trim()}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </span>
      ) : children}
    </button>
  );
}
