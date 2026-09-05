import type { AuthLayoutProps } from '../types';

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
