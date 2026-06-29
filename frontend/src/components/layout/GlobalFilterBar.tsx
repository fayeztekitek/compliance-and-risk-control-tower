import { useState } from "react";
import { Filter, X, RotateCcw, Calendar, Building2 } from "lucide-react";
import { useGlobalFilterStore } from "../../store/globalFilter.store";

export default function GlobalFilterBar() {
  const { filters, active, setFilter, resetFilters, toggleActive } = useGlobalFilterStore();
  const [startDate, setStartDate] = useState(filters.dateRange?.[0] || "");
  const [endDate, setEndDate] = useState(filters.dateRange?.[1] || "");

  const hasFilters = filters.dateRange || filters.organizationIds.length > 0 || filters.query;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 px-4 py-1.5">
        <button
          onClick={toggleActive}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            active ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
        </button>

        {active && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setFilter("dateRange", e.target.value && endDate ? [e.target.value, endDate] : null); }}
                className="w-32 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setFilter("dateRange", startDate && e.target.value ? [startDate, e.target.value] : null); }}
                className="w-32 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              />
            </div>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilter("query", e.target.value)}
              placeholder="Filter by keyword..."
              className="flex-1 max-w-xs px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
            />
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        )}

        {!active && hasFilters && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {filters.dateRange && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{filters.dateRange[0]} - {filters.dateRange[1]}</span>}
            {filters.query && <span className="flex items-center gap-1">"{filters.query}"</span>}
            <button onClick={resetFilters} className="ml-1 hover:text-slate-600"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
