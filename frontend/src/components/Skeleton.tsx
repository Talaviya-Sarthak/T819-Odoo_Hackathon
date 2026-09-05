interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'rectangular' | 'circular';
}

export default function Skeleton({
  className = '',
  lines = 1,
  variant = 'text'
}: SkeletonProps) {
  if (variant === 'circular') {
    return <div className={`animate-pulse rounded-full bg-gray-200 ${className}`} />;
  }

  if (variant === 'rectangular') {
    return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 animate-pulse rounded bg-gray-200 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
