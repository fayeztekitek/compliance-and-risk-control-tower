import { Building2, AppWindow, Bug, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, PauseCircle, FileText, AlertCircle, CheckSquare, Clock, EyeOff, TrendingUp as TrendingUpIcon, Layers, Zap, Calendar, XCircle, CheckCircle, Shield, AlertOctagon, TrendingDown as TrendingDownIcon } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  building: Building2,
  appwindow: AppWindow,
  bug: Bug,
  alert: AlertTriangle,
  activity: Activity,
  pause: PauseCircle,
  filetext: FileText,
  "alert-triangle": AlertTriangle,
  "alert-circle": AlertCircle,
  "check-square": CheckSquare,
  clock: Clock,
  "eye-off": EyeOff,
  "trending-up": TrendingUpIcon,
  layers: Layers,
  zap: Zap,
  calendar: Calendar,
  "x-circle": XCircle,
  "check-circle": CheckCircle,
  shield: Shield,
  "alert-octagon": AlertOctagon,
  "trending-down": TrendingDownIcon,
};

const colorMap: Record<string, { bg: string; icon: string }> = {
  building: { bg: "bg-indigo-100", icon: "text-indigo-600" },
  appwindow: { bg: "bg-blue-100", icon: "text-blue-600" },
  bug: { bg: "bg-red-100", icon: "text-red-600" },
  alert: { bg: "bg-amber-100", icon: "text-amber-600" },
  activity: { bg: "bg-green-100", icon: "text-green-600" },
  pause: { bg: "bg-slate-100", icon: "text-slate-600" },
  filetext: { bg: "bg-indigo-100", icon: "text-indigo-600" },
  "alert-triangle": { bg: "bg-red-100", icon: "text-red-600" },
  "alert-circle": { bg: "bg-orange-100", icon: "text-orange-600" },
  "check-square": { bg: "bg-purple-100", icon: "text-purple-600" },
  clock: { bg: "bg-amber-100", icon: "text-amber-600" },
  "eye-off": { bg: "bg-slate-100", icon: "text-slate-600" },
  "trending-up": { bg: "bg-blue-100", icon: "text-blue-600" },
  layers: { bg: "bg-cyan-100", icon: "text-cyan-600" },
  zap: { bg: "bg-yellow-100", icon: "text-yellow-600" },
  calendar: { bg: "bg-indigo-100", icon: "text-indigo-600" },
  "x-circle": { bg: "bg-red-100", icon: "text-red-600" },
  "check-circle": { bg: "bg-green-100", icon: "text-green-600" },
  shield: { bg: "bg-purple-100", icon: "text-purple-600" },
  "alert-octagon": { bg: "bg-red-100", icon: "text-red-600" },
  "trending-down": { bg: "bg-green-100", icon: "text-green-600" },
};

export interface KpiCardProps {
  icon: string;
  title: string;
  value: number;
  delta: number;
  deltaLabel: string;
  deltaDirection: "up" | "down" | "flat";
}

export function KpiCard({ icon, title, value, delta, deltaLabel, deltaDirection }: KpiCardProps) {
  const Icon = iconMap[icon] || Building2;
  const colors = colorMap[icon] || { bg: "bg-slate-100", icon: "text-slate-600" };
  const DeltaIcon = deltaDirection === "up" ? TrendingUp : deltaDirection === "down" ? TrendingDown : Minus;
  const deltaColor = deltaDirection === "up" ? "text-red-500" : deltaDirection === "down" ? "text-green-500" : "text-slate-400";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{value.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
        <DeltaIcon className={`w-3.5 h-3.5 ${deltaColor}`} />
        <span className={`text-xs font-medium ${deltaColor}`}>
          {delta >= 0 ? "+" : ""}{delta} {deltaLabel}
        </span>
      </div>
    </div>
  );
}
