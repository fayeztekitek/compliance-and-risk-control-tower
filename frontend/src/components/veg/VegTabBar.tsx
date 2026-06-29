import { Briefcase, FileSignature } from "lucide-react";

export default function VegTabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <div className="flex border-b border-slate-200 mb-6">
      <button
        onClick={() => onTabChange("deals")}
        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "deals" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <Briefcase className="w-4 h-4 inline mr-2" />Deal Register
      </button>
      <button
        onClick={() => onTabChange("workflow")}
        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "workflow" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <FileSignature className="w-4 h-4 inline mr-2" />Workflow Requests
      </button>
    </div>
  );
}
