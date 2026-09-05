interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export default function Card({
  children,
  className = '',
  padding = 'p-6'
}: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${padding} ${className}`}>
      {children}
    </div>
  );
}
