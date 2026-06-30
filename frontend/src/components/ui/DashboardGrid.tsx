import { type ReactNode } from "react";

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export function KpiCardGrid({ children, className = "" }: DashboardGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 ${className}`}>
      {children}
    </div>
  );
}

export function ChartGrid({ children, className = "", cols = 2 }: DashboardGridProps & { cols?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-${cols} gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function ChartCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, icon: Icon, actions }: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-indigo-500" />}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  color?: string;
  sub?: string;
}) {
  const iconColor = color || "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10";
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg shrink-0 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
