import type { InputProps } from '../types';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`rounded-lg border bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all ${
          error ? 'border-destructive focus:ring-1 focus:ring-destructive' : 'border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40'
        }`}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
