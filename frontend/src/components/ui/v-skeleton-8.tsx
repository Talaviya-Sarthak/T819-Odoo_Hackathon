import React from 'react';
import { Skeleton } from "@/components/ui/v-skeleton-8-utils/skeleton";
import { cn } from "@/lib/utils";

export interface PatternProps {
  className?: string;
  showSidebar?: boolean;
  cardsCount?: number;
  rowsCount?: number;
}

export function Pattern({
  className,
  showSidebar = false,
  cardsCount = 4,
  rowsCount = 5,
}: PatternProps) {
  if (showSidebar) {
    return (
      <div className={cn("flex w-full h-[540px] max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-2xl backdrop-blur-md", className)}>
        {/* Full-height Responsive Sidebar */}
        <div className="flex w-56 shrink-0 flex-col gap-2 border-r border-border/50 bg-card/60 p-4">
          <div className="mb-4 flex items-center gap-2.5 px-1 py-1">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="space-y-1">
            {[75, 60, 85, 50, 65].map((w, i) => (
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2" key={i}>
                <Skeleton className="size-4 rounded-md shrink-0" />
                <Skeleton className="h-3.5" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-border/40 pt-4 space-y-1">
            <div className="px-2 pb-1">
              <Skeleton className="h-3 w-16" />
            </div>
            {[55, 70].map((w, i) => (
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2" key={i}>
                <Skeleton className="size-4 rounded-md shrink-0" />
                <Skeleton className="h-3.5" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/50 p-2.5">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          </div>
        </div>

        {/* Dynamic Main Section */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-card/30">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>

          <div className="flex-1 space-y-5 p-6 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-4" key={i}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="size-4 rounded-full" />
                  </div>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-xl border border-border/50 bg-card/40 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="flex items-center gap-4 py-2.5 border-b border-border/20 last:border-none" key={i}>
                  <Skeleton className="size-7 rounded-md shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Dynamic Page Skeleton (Fills 100% width and height of container dynamically)
  return (
    <div className={cn("w-full space-y-6 animate-in fade-in duration-200", className)}>
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Dynamic KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 max-w-full rounded" />
          </div>
        ))}
      </div>

      {/* Dynamic Main Content / Table Area */}
      <div className="w-full overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-xs">
        {/* Table Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-border/40 bg-card/30">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg hidden md:block" />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Table Row Skeletons */}
        <div className="p-4 space-y-3">
          {Array.from({ length: rowsCount }).map((_, rIdx) => (
            <div key={rIdx} className="flex items-center gap-4 py-3 border-b border-border/25 last:border-none">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-48 max-w-full rounded" />
                <Skeleton className="h-3 w-32 max-w-full rounded" />
              </div>
              <Skeleton className="h-4 w-28 hidden md:block rounded" />
              <Skeleton className="h-4 w-20 hidden lg:block rounded" />
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              <Skeleton className="h-8 w-20 rounded-lg shrink-0 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Pattern;
