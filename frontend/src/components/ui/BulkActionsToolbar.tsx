import { X } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClear: () => void;
  actions: { label: string; onClick: () => void; variant?: "default" | "danger" }[];
}

export default function BulkActionsToolbar({ selectedCount, onClear, actions }: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg">
      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedCount} selected</span>
      <div className="flex gap-2 ml-2">
        {actions.map(a => (
          <button key={a.label} onClick={a.onClick}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              a.variant === "danger"
                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-800/50 dark:text-indigo-300"
            }`}>
            {a.label}
          </button>
        ))}
      </div>
      <button onClick={onClear} className="ml-auto p-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-700 text-indigo-500" title="Clear selection">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
