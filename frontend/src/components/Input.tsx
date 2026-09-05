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
      {label && <label className="text-sm font-medium">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`rounded-md border px-3 py-2.5 text-sm outline-none transition-colors ${
          error ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
        }`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
