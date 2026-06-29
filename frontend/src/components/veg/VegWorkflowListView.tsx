import { Plus, Search, FileSignature } from "lucide-react";
import { TypeBadge, StatusBadge } from "../ui/Badge";
import { SkeletonTable } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import Pagination from "../ui/Pagination";
import { WF_STATUSES, WF_TYPES } from "../../utils/veg";
import type { VegRequest } from "../../types/veg";

interface Props {
  list: { data: VegRequest[]; total: number; page: number; limit: number } | undefined;
  loading: boolean;
  filters: { page: number; limit: number; status?: string; type?: string; search?: string };
  search: string;
  onSearchChange: (val: string) => void;
  onSearch: () => void;
  onFilterChange: (key: string, val: any) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onFiltersChange: (filters: any) => void;
}

export default function VegWorkflowListView({ list, loading, filters, search, onSearchChange, onSearch, onFilterChange, onSelect, onCreate, onFiltersChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">VEG Workflow Requests</h2>
          <p className="text-sm text-slate-500 mt-1">Governance request lifecycle — {list?.total || 0} total</p>
        </div>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by client or title..."
              value={search} onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSearch()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filters.status || ""} onChange={e => onFilterChange("status", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Statuses</option>
            {WF_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filters.type || ""} onChange={e => onFilterChange("type", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Types</option>
            {WF_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5"><SkeletonTable rows={8} /></div>
      ) : !list || list.data.length === 0 ? (
        <EmptyState icon={FileSignature} title="No workflow requests found"
          description="Create a new VEG workflow request to get started."
          action={{ label: "New Request", onClick: onCreate }} />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="text-left px-3 py-3 font-medium">Title</th>
                    <th className="text-left px-3 py-3 font-medium">Client</th>
                    <th className="text-left px-3 py-3 font-medium">Type</th>
                    <th className="text-left px-3 py-3 font-medium">Status</th>
                    <th className="text-left px-3 py-3 font-medium">Bid</th>
                    <th className="text-left px-3 py-3 font-medium">Go/No-Go</th>
                    <th className="text-left px-3 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((req) => (
                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => onSelect(req.id)}>
                      <td className="px-3 py-3 font-medium text-slate-800 max-w-[250px] truncate">{req.title}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[150px] truncate">{req.client}</td>
                      <td className="px-3 py-3"><TypeBadge type={req.type} /></td>
                      <td className="px-3 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-3 py-3">
                        {req.bidDecision === "BID" ? <span className="text-green-600 text-xs font-medium">BID</span>
                          : req.bidDecision === "NO_BID" ? <span className="text-red-600 text-xs font-medium">NO BID</span>
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {req.goNoGoDecision === "GO" ? <span className="text-green-600 text-xs font-medium">GO</span>
                          : req.goNoGoDecision === "NO_GO" ? <span className="text-red-600 text-xs font-medium">NO GO</span>
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{new Date(req.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {list && <Pagination page={list.page} limit={list.limit} total={list.total} onPageChange={p => onFiltersChange({ ...filters, page: p })} onLimitChange={l => onFiltersChange({ ...filters, limit: l, page: 1 })} />}
        </>
      )}
    </div>
  );
}
