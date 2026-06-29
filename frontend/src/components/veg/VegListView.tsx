import { useState } from "react";
import { Plus, Search, FileText, Briefcase, ChevronLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { DecisionBadge, SalesBadge } from "../ui/Badge";
import { fmtNum, fmtK, REGIONS, BUSINESS_LINES, DECISIONS } from "../../utils/veg";
import { SkeletonTable } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import Pagination from "../ui/Pagination";
import { vegDealApi } from "../../api/veg.api";
import * as XLSX from "xlsx";
import type { VegDeal, VegDealListParams } from "../../types/veg";

interface Props {
  listData: { data: VegDeal[]; total: number; page: number; limit: number } | undefined;
  listLoading: boolean;
  filters: VegDealListParams;
  search: string;
  onSearchChange: (val: string) => void;
  onSearch: () => void;
  onFilterChange: (key: string, val: any) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDashboard: () => void;
  onFiltersChange: (filters: VegDealListParams) => void;
}

export default function VegListView({ listData, listLoading, filters, search, onSearchChange, onSearch, onFilterChange, onSelect, onCreate, onDashboard, onFiltersChange }: Props) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; alreadyExists: number; errors: number } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: null });
      const mapped = rows.map((r: any) => ({
        vegId: String(r.VEG_ID ?? r.vegId ?? r.veg_id ?? "").trim(),
        client: String(r.Client ?? r.client ?? "").trim(),
        businessOwner: String(r.Business_Owner ?? r["Business Owner"] ?? r.businessOwner ?? "").trim(),
        region: String(r.Region ?? r.region ?? "").trim(),
        businessLine: String(r.Business_Line ?? r["Business Line"] ?? r.businessLine ?? "").trim(),
        products: String(r.Products ?? r.products ?? "").trim(),
        committeeType: String(r.Committee_Type ?? r["Committee Type"] ?? r.committeeType ?? "").trim(),
        vegDate: String(r.VEG_Date ?? r["VEG Date"] ?? r.vegDate ?? "").trim(),
        decision: String(r.Decision ?? r.decision ?? "").trim(),
        tcv: parseFloat(r.TCV ?? r.tcv ?? 0) || 0,
        ipMaintenance: parseFloat(r.IP_Maintenance ?? r["IP Maintenance"] ?? r.ipMaintenance ?? 0) || 0,
        saas: parseFloat(r.SaaS ?? r.SAAS ?? r.saas ?? 0) || 0,
        ps: parseFloat(r.PS ?? r.ps ?? 0) || 0,
        wlPsMd: parseFloat(r.WL_PS_MD ?? r["WL PS MD"] ?? r.wlPsMd ?? 0) || 0,
        wlInvestmentMd: parseFloat(r.WL_Investment_MD ?? r["WL Investment MD"] ?? r.wlInvestmentMd ?? 0) || 0,
        vegYear: parseInt(r.VEG_Year ?? r["VEG Year"] ?? r.vegYear ?? new Date().getFullYear()) || new Date().getFullYear(),
        salesStatus: String(r.Sales_Status ?? r["Sales Status"] ?? r.salesStatus ?? "Open").trim(),
        invstStartDate: String(r.Investment_Start_Date ?? r["Investment Start Date"] ?? r.invstStartDate ?? "").trim(),
      })).filter(r => r.vegId.length > 0);
      const res = await vegDealApi.importFromExcel(mapped);
      setImportResult(res.data);
    } catch (err) {
      setImportResult({ imported: 0, alreadyExists: 0, errors: 1 });
    } finally {
      setImporting(false);
    }
  };

  if (importModalOpen) {
    return (
      <div className="space-y-6 max-w-xl">
        <button onClick={() => { setImportModalOpen(false); setImportResult(null); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to list
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Import VEG Deals from Excel</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {!importResult ? (
            <>
              <p className="text-sm text-slate-600">Select an Excel file (.xlsx) with columns matching the VEG Deal fields. Rows with existing VEG IDs will be skipped.</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 cursor-pointer hover:border-indigo-400 transition-colors">
                <FileText className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">{importing ? "Processing..." : "Click to select file"}</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportFile} disabled={importing} className="hidden" />
              </label>
            </>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${importResult.errors > 0 ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                {importResult.errors > 0 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                <div>
                  <p className="font-medium text-sm">{importResult.errors > 0 ? "Import completed with errors" : "Import completed"}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {importResult.imported > 0 ? `${importResult.imported} new entry loaded.` : "No new records imported."}
                    {importResult.alreadyExists > 0 ? ` ${importResult.alreadyExists} deals already exist and were skipped.` : ""}
                    {importResult.errors > 0 ? ` ${importResult.errors} errors encountered.` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => { setImportModalOpen(false); setImportResult(null); window.location.reload(); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Done</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">VEG Deal Register</h2>
          <p className="text-sm text-slate-500 mt-1">All VEG committee reviewed deals — {listData?.total || 0} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onDashboard} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Dashboard</button>
          <button onClick={() => setImportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
            <FileText className="w-4 h-4" /> Import Excel
          </button>
          <button onClick={() => {
            const p = new URLSearchParams();
            if (filters.search) p.set("search", filters.search);
            if (filters.region) p.set("region", filters.region);
            if (filters.businessLine) p.set("businessLine", filters.businessLine);
            if (filters.decision) p.set("decision", filters.decision);
            if (filters.salesStatus) p.set("salesStatus", filters.salesStatus);
            if (filters.year) p.set("year", String(filters.year));
            window.open(`/api/veg-deals/export?${p.toString()}`, "_blank");
          }} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> New Deal
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search client, owner, VEG ID..."
              value={search} onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSearch()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filters.region || ""} onChange={e => onFilterChange("region", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.businessLine || ""} onChange={e => onFilterChange("businessLine", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Lines</option>
            {BUSINESS_LINES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filters.decision || ""} onChange={e => onFilterChange("decision", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm max-w-[160px]">
            <option value="">All Decisions</option>
            {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.salesStatus || ""} onChange={e => onFilterChange("salesStatus", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Sales</option>
            <option value="Won">Won</option><option value="Lost">Lost</option><option value="Open">Open</option>
            <option value="Canceled">Canceled</option><option value="Committed">Committed</option>
          </select>
          <select value={filters.year ? String(filters.year) : ""} onChange={e => onFilterChange("year", e.target.value ? parseInt(e.target.value) : undefined)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Years</option>
            <option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option>
          </select>
        </div>
      </div>

      {listLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5"><SkeletonTable rows={8} /></div>
      ) : !listData || listData.data.length === 0 ? (
        <EmptyState icon={Briefcase} title="No VEG deals found" description="Try adjusting your filters or import the Excel spreadsheet."
          action={{ label: "New Deal", onClick: onCreate }} />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="text-left px-3 py-3 font-medium">VEG ID</th>
                    <th className="text-left px-3 py-3 font-medium">Client</th>
                    <th className="text-left px-3 py-3 font-medium">Owner</th>
                    <th className="text-left px-3 py-3 font-medium">Line</th>
                    <th className="text-left px-3 py-3 font-medium">Region</th>
                    <th className="text-left px-3 py-3 font-medium">Type</th>
                    <th className="text-left px-3 py-3 font-medium">Decision</th>
                    <th className="text-right px-3 py-3 font-medium">TCV</th>
                    <th className="text-right px-3 py-3 font-medium">PS</th>
                    <th className="text-left px-3 py-3 font-medium">Sales</th>
                    <th className="text-left px-3 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {listData.data.map((deal) => (
                    <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => onSelect(deal.id)}>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">{deal.veg_id}</td>
                      <td className="px-3 py-3 font-medium text-slate-800 max-w-[180px] truncate">{deal.client}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate">{deal.business_owner}</td>
                      <td className="px-3 py-3 text-slate-600">{deal.business_line}</td>
                      <td className="px-3 py-3 text-slate-600">{deal.region}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{deal.committee_type}</td>
                      <td className="px-3 py-3"><DecisionBadge decision={deal.decision} /></td>
                      <td className="px-3 py-3 text-right font-mono text-sm">{fmtK(deal.tcv)}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-slate-500">{deal.wl_ps_md ? fmtNum(deal.wl_ps_md) + "md" : "—"}</td>
                      <td className="px-3 py-3"><SalesBadge status={deal.sales_status} /></td>
                      <td className="px-3 py-3 text-xs text-slate-500">{new Date(deal.veg_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {listData && <Pagination page={listData.page} limit={listData.limit} total={listData.total} onPageChange={p => onFiltersChange({ ...filters, page: p })} onLimitChange={l => onFiltersChange({ ...filters, limit: l, page: 1 })} />}
        </>
      )}
    </div>
  );
}
