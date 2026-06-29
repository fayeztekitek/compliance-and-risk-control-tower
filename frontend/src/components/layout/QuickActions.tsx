import { useNavigate } from "react-router-dom";
import { Plus, FileText, Shield, Bug, FileCheck, Briefcase } from "lucide-react";

const ACTIONS = [
  { label: "New VEG Deal", icon: Briefcase, path: "/veg/list", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
  { label: "Import Scan", icon: Shield, path: "/security", color: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
  { label: "New Audit", icon: FileCheck, path: "/audits", color: "text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400" },
  { label: "Report Vulnerability", icon: Bug, path: "/vulnerabilities", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  { label: "New Committee", icon: FileText, path: "/committees", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mr-1">Quick</span>
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors hover:opacity-80 ${a.color}`}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
