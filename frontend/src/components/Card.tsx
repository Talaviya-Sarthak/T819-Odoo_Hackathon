import React from 'react';

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
    <div className={`rounded-xl border border-border/50 bg-card text-card-foreground shadow-xs ${padding} ${className}`}>
      {children}
    </div>
  );
}
