import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X, Search, Building2, AppWindow, ShieldAlert,
  Activity, Calendar, RotateCcw, SlidersHorizontal,
  ChevronDown, Check, Filter,
} from "lucide-react";
import { useDashboardFilterStore, DashboardFilter } from "../../store/dashboardFilter.store";
import { dashboardApi } from "../../api/dashboard.api";
import { OrgHierarchyItem } from "../../types/nexus";

const SEVERITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical", color: "bg-red-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-500" },
  { value: "LOW", label: "Low", color: "bg-blue-500" },
];

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "FIXED", label: "Resolved" },
  { value: "WAIVED", label: "Waived" },
  { value: "ACCEPTED", label: "Accepted Risk" },
  { value: "FALSE_POSITIVE", label: "False Positive" },
];

const PERIOD_OPTIONS = [
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "last-90-days", label: "Last 90 days" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "last-year", label: "Last year" },
  { value: "custom", label: "Custom" },
];

const SCAN_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "never_scanned", label: "Never Scanned" },
];

const RISK_LEVEL_OPTIONS = [
  { value: "CRITICAL", label: "Critical", color: "bg-red-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-500" },
  { value: "LOW", label: "Low", color: "bg-blue-500" },
];

const SCOPE_OPTIONS = [
  { value: "latest", label: "Latest Only" },
  { value: "previous", label: "Previous Only" },
  { value: "all", label: "All Reports" },
];

function CheckboxGroup({
  options, selected, onChange, label,
}: {
  options: { value: string; label: string; color?: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  const allSelected = options.every((o) => selected.includes(o.value));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <button
          onClick={() => onChange(allSelected ? [] : options.map((o) => o.value))}
          className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="space-y-1">
        {options.map((opt) => {
          const isOn = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-sm transition-colors"
            >
              <button
                onClick={() =>
                  onChange(
                    isOn
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value]
                  )
                }
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isOn
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-slate-300 hover:border-indigo-400"
                }`}
              >
                {isOn && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex items-center gap-1.5">
                {opt.color && <span className={`w-2 h-2 rounded-full ${opt.color}`} />}
                <span className="text-slate-700">{opt.label}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelectInput({
  label, options, selected, onChange, placeholder,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const toggle = (val: string) => {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  };

  return (
    <div className="relative">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</span>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-left hover:border-indigo-300 transition-colors"
      >
        <span className={selected.length > 0 ? "text-slate-700" : "text-slate-400"}>
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-md">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-sm outline-none w-full text-slate-600 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">No results</div>
            )}
            {filtered.map((opt) => {
              const isOn = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-sm transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isOn ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                    }`}
                  >
                    {isOn && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-slate-700">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveFilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-medium border border-indigo-200">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function FilterPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { filters, setFilter, setMultipleFilters, resetFilters } = useDashboardFilterStore();

  const { data: orgData } = useQuery({
    queryKey: ["dashboard", "org-hierarchy"],
    queryFn: async () => {
      const { data } = await dashboardApi.orgHierarchy();
      return data.data as OrgHierarchyItem[];
    },
    staleTime: 120_000,
  });

  const orgOptions = useMemo(
    () =>
      (orgData || [])
        .filter((o) => o.organizationId !== "ROOT_ORGANIZATION_ID")
        .map((o) => ({ value: o.organizationId, label: o.organizationName })),
    [orgData]
  );

  const [customFrom, setCustomFrom] = useState(filters.reportDateFrom || "");
  const [customTo, setCustomTo] = useState(filters.reportDateTo || "");

  const isCustom = filters.reportPeriod === "custom";

  const applyCustom = useCallback(() => {
    if (customFrom || customTo) {
      setMultipleFilters({
        reportDateFrom: customFrom || null,
        reportDateTo: customTo || null,
      });
    }
  }, [customFrom, customTo, setMultipleFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.organizationIds.length > 0) count++;
    if (filters.applicationIds.length > 0) count++;
    if (filters.severities.length < 4) count++;
    if (filters.statuses.length < 6) count++;
    if (filters.reportPeriod !== "last-90-days") count++;
    if (filters.scanStatus.length < 2) count++;
    if (filters.riskLevel.length < 4) count++;
    if (filters.scanReportScope !== "latest") count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-40 flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="text-[11px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active badges */}
        {activeFilterCount > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-1">
            {filters.organizationIds.length > 0 && (
              <ActiveFilterBadge
                label={`${filters.organizationIds.length} orgs`}
                onRemove={() => setFilter("organizationIds", [])}
              />
            )}
            {filters.applicationIds.length > 0 && (
              <ActiveFilterBadge
                label={`${filters.applicationIds.length} apps`}
                onRemove={() => setFilter("applicationIds", [])}
              />
            )}
            {filters.severities.length < 4 && (
              <ActiveFilterBadge
                label={`${filters.severities.join(", ").toLowerCase()}`}
                onRemove={() =>
                  setFilter("severities", ["CRITICAL", "HIGH", "MEDIUM", "LOW"])
                }
              />
            )}
            {filters.reportPeriod !== "last-90-days" && (
              <ActiveFilterBadge
                label={PERIOD_OPTIONS.find((p) => p.value === filters.reportPeriod)?.label || filters.reportPeriod}
                onRemove={() => setFilter("reportPeriod", "last-90-days")}
              />
            )}
          </div>
        )}

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Search */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Search</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={filters.searchQuery}
                onChange={(e) => setFilter("searchQuery", e.target.value)}
                placeholder="Search vulnerabilities..."
                className="bg-transparent text-sm outline-none w-full text-slate-600 placeholder:text-slate-400"
              />
              {filters.searchQuery && (
                <button onClick={() => setFilter("searchQuery", "")} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Organization */}
          <MultiSelectInput
            label="Organization"
            options={orgOptions}
            selected={filters.organizationIds}
            onChange={(values) => setFilter("organizationIds", values)}
            placeholder="All organizations"
          />

          {/* Severity */}
          <CheckboxGroup
            label="Severity"
            options={SEVERITY_OPTIONS}
            selected={filters.severities}
            onChange={(values) => setFilter("severities", values)}
          />

          {/* Vulnerability Status */}
          <CheckboxGroup
            label="Vulnerability Status"
            options={STATUS_OPTIONS}
            selected={filters.statuses}
            onChange={(values) => setFilter("statuses", values)}
          />

          {/* Report Period */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Report Period</span>
            <div className="space-y-1">
              {PERIOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-sm transition-colors"
                >
                  <button
                    onClick={() => setFilter("reportPeriod", opt.value)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      filters.reportPeriod === opt.value
                        ? "border-indigo-600"
                        : "border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {filters.reportPeriod === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </button>
                  <span className="text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {isCustom && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                />
                <button
                  onClick={applyCustom}
                  className="px-2 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Scan Status */}
          <CheckboxGroup
            label="Scan Status"
            options={SCAN_STATUS_OPTIONS}
            selected={filters.scanStatus}
            onChange={(values) => setFilter("scanStatus", values)}
          />

          {/* Risk Level */}
          <CheckboxGroup
            label="Risk Level"
            options={RISK_LEVEL_OPTIONS}
            selected={filters.riskLevel}
            onChange={(values) => setFilter("riskLevel", values)}
          />

          {/* Scan Report Scope */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Scan Report</span>
            <div className="space-y-1">
              {SCOPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-sm transition-colors"
                >
                  <button
                    onClick={() => setFilter("scanReportScope", opt.value)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      filters.scanReportScope === opt.value
                        ? "border-indigo-600"
                        : "border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {filters.scanReportScope === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </button>
                  <span className="text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
