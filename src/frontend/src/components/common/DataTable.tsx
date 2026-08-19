import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: (item: T) => string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage,
  rowClassName,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return <SkeletonLoader type="table" rows={5} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto overscroll-x-contain touch-pan-x" role="region" aria-label="Bảng dữ liệu">
        <table className="w-full min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item) => {
              const extraClass = rowClassName ? rowClassName(item) : '';
              return (
                <tr
                  key={keyExtractor(item)}
                  className={`hover:bg-slate-50/80 transition-colors ${extraClass}`}
                >
                  {columns.map((col, idx) => {
                    let cellValue: React.ReactNode = null;
                    if (typeof col.accessor === 'function') {
                      cellValue = col.accessor(item);
                    } else if (col.accessor) {
                      cellValue = String(item[col.accessor] ?? '');
                    }
                    return (
                      <td key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-3 sm:px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500 font-medium">
            Trang <span className="font-semibold text-slate-800">{currentPage}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
