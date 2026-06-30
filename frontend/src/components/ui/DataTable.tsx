import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyIcon?: React.ElementType;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  if (direction === "asc") return <ChevronUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
  if (direction === "desc") return <ChevronDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
  return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  onRowClick,
  page, limit, total, onPageChange, onLimitChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    setSortKey(prev => {
      if (prev !== key) { setSortDir("asc"); return key; }
      setSortDir(prevDir => prevDir === "asc" ? "desc" : prevDir === "desc" ? null : "asc");
      return key;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle || "No data"}
        description={emptyDescription || "No records to display"}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.headerClassName || ""} ${col.sortable ? "cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {sorted.map(item => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30" : ""} transition-colors`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${col.className || ""}`}>
                    {col.render ? col.render(item) : (item as any)[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page !== undefined && total !== undefined && onPageChange && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <Pagination
            page={page}
            limit={limit || 10}
            total={total}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
}
