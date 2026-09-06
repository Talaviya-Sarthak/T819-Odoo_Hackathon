import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginationControlsProps {
  pagination?: PaginationState;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  page: propPage,
  limit: propLimit,
  total: propTotal,
  totalPages: propTotalPages,
  hasNextPage: propHasNextPage,
  hasPreviousPage: propHasPreviousPage,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  className = '',
}) => {
  const activePagination = pagination || {
    page: propPage ?? 1,
    limit: propLimit ?? 20,
    total: propTotal ?? 0,
    totalPages: propTotalPages ?? (propLimit ? Math.ceil((propTotal ?? 0) / propLimit) : 1),
    hasNextPage: propHasNextPage,
    hasPreviousPage: propHasPreviousPage,
  };

  if (!activePagination || activePagination.total === 0) return null;

  const { page, limit, total, totalPages } = activePagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-card border-t border-border/50 text-sm ${className}`}>
      {/* Showing range text and page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs sm:text-sm">
        <span>
          Showing <span className="font-semibold text-foreground">{startItem}</span> to{' '}
          <span className="font-semibold text-foreground">{endItem}</span> of{' '}
          <span className="font-semibold text-foreground">{total}</span> records
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-border/60 pl-3">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={loading}
              className="h-8 rounded-md border border-border/80 bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || loading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First Page"
          type="button"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                disabled={loading}
                type="button"
                className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-muted-foreground">
                ...
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || loading}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
          type="button"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
