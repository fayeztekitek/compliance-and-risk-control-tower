import { Lightbulb, AlertTriangle, CheckCircle, Sparkles, type LucideIcon } from "lucide-react";

interface AiInsightCardProps {
  title: string;
  content: string;
  icon?: LucideIcon;
  severity?: "info" | "warning" | "positive";
  confidence?: number;
  onDismiss?: () => void;
}

const SEVERITY_STYLES = {
  info: {
    border: "border-indigo-200 dark:border-indigo-800",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    icon: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  positive: {
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/50",
    icon: "text-green-600 dark:text-green-400",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
};

export function AiInsightCard({ title, content, icon: Icon, severity = "info", confidence, onDismiss }: AiInsightCardProps) {
  const styles = SEVERITY_STYLES[severity];
  const DefaultIcon = Icon || (severity === "warning" ? AlertTriangle : severity === "positive" ? CheckCircle : Lightbulb);

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${styles.icon}`}>
          <DefaultIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            {confidence !== undefined && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles.badge}`}>
                {confidence}% confidence
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 ml-auto shrink-0">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{content}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            aria-label="Dismiss"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default AiInsightCard;
