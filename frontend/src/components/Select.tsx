import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
  disabled,
  className = ''
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all ${
          error ? 'border-destructive' : 'border-border/60 focus:border-primary'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {placeholder && (
          <option value="" disabled className="bg-card text-muted-foreground">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-card text-foreground">
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
