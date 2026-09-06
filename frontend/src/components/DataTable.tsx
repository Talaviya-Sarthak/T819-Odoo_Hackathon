import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Inbox } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import PaginationControls, { PaginationState } from './PaginationControls';

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T = any> {
  columns?: Column<any>[];
  data?: any[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

const rowVariants: any = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: 'easeOut',
    },
  }),
};

export default function DataTable<T = any>({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  pagination,
  onPageChange,
  onLimitChange,
  pageSizeOptions,
}: DataTableProps<T>) {
  if (loading) {
    const colCount = columns.length > 0 ? columns.length : 5;
    return (
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {columns.length > 0 ? (
                  columns.map((col) => (
                    <th 
                      key={col.key} 
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {col.label}
                    </th>
                  ))
                ) : (
                  Array.from({ length: colCount }).map((_, i) => (
                    <th key={i} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-24" />
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-border/30 last:border-none">
                  {Array.from({ length: colCount }).map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <Skeleton
                        className={`h-4 ${
                          cIdx === 0
                            ? 'w-32'
                            : cIdx === 1
                            ? 'w-44'
                            : cIdx === colCount - 1
                            ? 'w-16'
                            : 'w-24'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="px-4 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={(row as any)?.id || i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick 
                      ? 'cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04]' 
                      : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-foreground">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          pageSizeOptions={pageSizeOptions}
          loading={loading}
        />
      )}
    </div>
  );
}
