import { Download } from "lucide-react";
import { downloadCsv } from "../../utils/export-csv";

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  label?: string;
}

export default function ExportButton({ data, filename, label = "CSV" }: ExportButtonProps) {
  return (
    <button
      onClick={() => downloadCsv(data, filename)}
      disabled={!data.length}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
