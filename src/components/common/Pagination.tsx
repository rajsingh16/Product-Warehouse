import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <span>Showing {first}–{last} of {total}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="sr-only">Page size</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((value) => <button type="button" key={value} onClick={() => onPageChange(value)} className={`min-w-8 rounded-md px-2 py-1 ${value === page ? 'bg-slate-800 text-white' : 'border border-slate-300'}`}>{value}</button>)}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
