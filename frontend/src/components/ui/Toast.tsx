import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useUIStore } from "../../store/ui.store";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-rose-50 border-rose-200 text-rose-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; type: "success" | "error" | "info" | "warning"; message: string };
  onDismiss: (id: string) => void;
}) {
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[toast.type]} animate-slide-in`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
