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
  const baseStyles = 'flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50';
  const variantStyles = variant === 'primary'
    ? 'bg-gray-900 text-white hover:bg-gray-700'
    : 'border border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${className}`.trim()}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
