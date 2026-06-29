import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vegDealSchema, vegWfSchema } from "../schemas/forms";
import type { VegDealForm, VegWfForm } from "../schemas/forms";
import { useParams, useLocation } from "react-router-dom";
import { Briefcase } from "lucide-react";
import {
  useVegDealList, useVegDealById, useVegDealStats,
  useVegDealMonthlyTrend, useVegDealYearOverYear,
  useCreateVegDeal, useUpdateVegDeal, useDeleteVegDeal,
  useVegList, useVegById, useCreateVeg, useUpdateVeg, useDeleteVeg,
  useSignoffVeg, useBidDecision, useGoNoGo,
  useCreateOpportunity, useCreateContract,
} from "../hooks/useVegRequests";
import VegTabBar from "../components/veg/VegTabBar";
import VegDashboardView from "../components/veg/VegDashboardView";
import VegListView from "../components/veg/VegListView";
import VegCreateEditView from "../components/veg/VegCreateEditView";
import VegDetailView from "../components/veg/VegDetailView";
import VegWorkflowListView from "../components/veg/VegWorkflowListView";
import VegWorkflowDetailView from "../components/veg/VegWorkflowDetailView";
import VegWorkflowCreateView from "../components/veg/VegWorkflowCreateView";
import { vegDealApi } from "../api/veg.api";
import type { VegDeal, VegDealListParams } from "../types/veg";
import EmptyState from "../components/ui/EmptyState";

type VSubMode = "dashboard" | "list" | "detail" | "create" | "edit"
  | "workflow" | "workflowDetail" | "workflowCreate";

export default function VegGovernanceWorkspace({ initialTab: propTab }: { initialTab?: string } = {}) {
  const params = useParams();
  const location = useLocation();
  const path = location.pathname;
  const effectiveTab = propTab || (path.includes("/workflow") ? "workflow" : params.dealId ? "deals" : "deals");

  const getInitialMode = (): VSubMode => {
    if (effectiveTab === "workflow") return "workflow";
    if (params.dealId) return "detail";
    return "list";
  };
  const initialMode = getInitialMode();

  const [mode, setMode] = useState<VSubMode>(initialMode);
  const [tab, setTab] = useState(effectiveTab);
  const [selectedId, setSelectedId] = useState<string | null>(params.dealId || null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VegDealListParams>({ page: 1, limit: 25 });
  const [search, setSearch] = useState("");
  const [wfFilters, setWfFilters] = useState<{ page: number; limit: number; status?: string; type?: string; search?: string }>({ page: 1, limit: 25 });
  const [wfSearch, setWfSearch] = useState("");

  const { data: listData, isLoading: listLoading } = useVegDealList(filters);
  const { data: detail } = useVegDealById(selectedId);
  const { data: stats, isLoading: statsLoading } = useVegDealStats();
  const { data: monthlyTrend } = useVegDealMonthlyTrend();
  const { data: yoyData } = useVegDealYearOverYear();
  const createDeal = useCreateVegDeal();
  const updateDeal = useUpdateVegDeal();
  const deleteDeal = useDeleteVegDeal();

  const { data: wfList, isLoading: wfListLoading } = useVegList(wfFilters);
  const { data: wfDetail } = useVegById(selectedWorkflowId);
  const createWf = useCreateVeg();
  const deleteWf = useDeleteVeg();
  const signoffWf = useSignoffVeg();
  const bidWf = useBidDecision();
  const gonogoWf = useGoNoGo();
  const createOpp = useCreateOpportunity();
  const createContract = useCreateContract();

  const dealFormHook = useForm<VegDealForm>({
    resolver: zodResolver(vegDealSchema),
    defaultValues: { vegId: "", client: "", businessOwner: "", region: "EU", businessLine: "Colline", products: "", committeeType: "Go n Go", vegDate: "", decision: "GO FINAL", tcv: 0, ipMaintenance: 0, saas: 0, ps: 0, wlPsMd: 0, wlInvestmentMd: 0, vegYear: new Date().getFullYear(), invstStartDate: "" },
  });
  const { reset: dealReset } = dealFormHook;

  const wfFormHook = useForm<VegWfForm>({ resolver: zodResolver(vegWfSchema), defaultValues: { title: "", client: "", type: "RFI", description: "", ownerId: "" } });
  const { reset: wfReset } = wfFormHook;

  function handleSelect(id: string) { setSelectedId(id); setMode("detail"); }
  function handleBack() { setMode("list"); setSelectedId(null); }

  function handleSearch() {
    setFilters(f => ({ ...f, search: search || undefined, page: 1 }));
  }

  function setFilter(key: string, val: any) {
    setFilters((f: VegDealListParams) => ({ ...f, [key]: val || undefined, page: 1 }));
  }

  async function handleCreate(data: VegDealForm) {
    await createDeal.mutateAsync({ ...data, vegDate: data.vegDate || new Date().toISOString().split("T")[0] });
    setMode("list");
  }

  async function handleUpdate(data: VegDealForm) {
    if (!selectedId) return;
    await updateDeal.mutateAsync({ id: selectedId, data });
    setMode("detail");
  }

  async function handleDelete(id: string) {
    await deleteDeal.mutateAsync(id);
    if (selectedId === id) handleBack();
  }

  function handleWfSearch() {
    setWfFilters(f => ({ ...f, search: wfSearch || undefined, page: 1 }));
  }

  function setWfFilter(key: string, val: any) {
    setWfFilters((f: any) => ({ ...f, [key]: val || undefined, page: 1 }));
  }

  async function handleWfCreate(data: VegWfForm) {
    await createWf.mutateAsync(data as any);
    wfReset();
    setMode("workflow");
  }

  async function handleSignoff(department: string, state: string) {
    if (!selectedWorkflowId) return;
    await signoffWf.mutateAsync({ id: selectedWorkflowId, department, state });
  }

  async function handleBid(decision: string) {
    if (!selectedWorkflowId) return;
    await bidWf.mutateAsync({ id: selectedWorkflowId, decision });
  }

  async function handleGoNoGo(decision: string) {
    if (!selectedWorkflowId) return;
    await gonogoWf.mutateAsync({ id: selectedWorkflowId, decision });
  }

  async function handleCreateOpp(data: any) {
    if (!selectedWorkflowId) return;
    await createOpp.mutateAsync({ vegId: selectedWorkflowId, data });
  }

  async function handleCreateContract(opportunityId: string, data: any) {
    await createContract.mutateAsync({ opportunityId, data });
  }

  function handleTabChange(newTab: string) {
    setTab(newTab);
    if (newTab === "deals") {
      if (!["dashboard", "list", "detail", "create", "edit"].includes(mode)) {
        setMode("dashboard");
      }
    } else {
      if (!["workflow", "workflowDetail", "workflowCreate"].includes(mode)) {
        setMode("workflow");
      }
    }
  }

  function handleWfSelect(id: string) { setSelectedWorkflowId(id); setMode("workflowDetail"); }
  function handleWfBack() { setMode("workflow"); setSelectedWorkflowId(null); }

  function handleEditDeal() {
    if (!detail) return;
    dealReset({
      vegId: detail.veg_id, client: detail.client, businessOwner: detail.business_owner,
      region: detail.region, businessLine: detail.business_line, products: (detail as any).products || "",
      committeeType: detail.committee_type, vegDate: detail.veg_date, decision: detail.decision,
      tcv: detail.tcv, ipMaintenance: detail.ip_maintenance, saas: detail.saas, ps: detail.ps,
      wlPsMd: detail.wl_ps_md, wlInvestmentMd: detail.wl_investment_md, vegYear: detail.veg_year,
      invstStartDate: detail.invst_start_date || "",
    });
    setMode("edit");
  }

  return (
    <div className="space-y-6">
      <VegTabBar activeTab={tab} onTabChange={handleTabChange} />

      {tab === "deals" && mode === "dashboard" && (
        <VegDashboardView stats={stats} statsLoading={statsLoading} monthlyTrend={monthlyTrend} yoyData={yoyData}
          onViewList={() => setMode("list")} onCreate={() => { dealReset(); setMode("create"); }} />
      )}

      {tab === "deals" && mode === "list" && (
        <VegListView listData={listData} listLoading={listLoading} filters={filters}
          search={search} onSearchChange={setSearch} onSearch={handleSearch}
          onFilterChange={setFilter} onSelect={handleSelect} onCreate={() => { dealReset(); setMode("create"); }}
          onDashboard={() => setMode("dashboard")} onFiltersChange={setFilters} />
      )}

      {tab === "deals" && (mode === "create" || mode === "edit") && (
        <VegCreateEditView mode={mode} formHook={dealFormHook}
          onSubmit={mode === "create" ? handleCreate : handleUpdate}
          onBack={() => { mode === "edit" ? setMode("detail") : setMode("list"); }}
          isPending={createDeal.isPending || updateDeal.isPending} />
      )}

      {tab === "deals" && mode === "detail" && detail && (
        <VegDetailView detail={detail} onBack={handleBack} onEdit={handleEditDeal} onDelete={handleDelete} />
      )}

      {tab === "workflow" && mode === "workflow" && (
        <VegWorkflowListView list={wfList as any} loading={wfListLoading} filters={wfFilters}
          search={wfSearch} onSearchChange={setWfSearch} onSearch={handleWfSearch}
          onFilterChange={setWfFilter} onSelect={handleWfSelect} onCreate={() => { wfReset(); setMode("workflowCreate"); }}
          onFiltersChange={setWfFilters} />
      )}

      {tab === "workflow" && mode === "workflowDetail" && wfDetail && (
        <VegWorkflowDetailView detail={wfDetail as any} onBack={handleWfBack}
          onDelete={(id) => deleteWf.mutateAsync(id)}
          onSubmit={(id) => updateWf.mutateAsync({ id, data: { status: "SUBMITTED" } as any })}
          onSignoff={handleSignoff} onBid={handleBid} onGoNoGo={handleGoNoGo}
          onCreateOpp={handleCreateOpp} onCreateContract={handleCreateContract}
          isCreatingOpp={createOpp.isPending} isCreatingContract={createContract.isPending} />
      )}

      {tab === "workflow" && mode === "workflowCreate" && (
        <VegWorkflowCreateView formHook={wfFormHook} onSubmit={handleWfCreate}
          onBack={() => setMode("workflow")} isPending={createWf.isPending} />
      )}

      {!["dashboard", "list", "detail", "create", "edit"].includes(mode) &&
       !["workflow", "workflowDetail", "workflowCreate"].includes(mode) && (
        <EmptyState icon={Briefcase} title="Select a view"
          description="Use the tabs above or navigation to browse VEG data."
          action={{ label: "Deal Dashboard", onClick: () => { setTab("deals"); setMode("dashboard"); } }} />
      )}
    </div>
  );
}
