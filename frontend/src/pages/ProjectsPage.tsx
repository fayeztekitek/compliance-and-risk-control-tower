import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, Plus, Search } from "lucide-react";
import { projectApi, type Project } from "../api/project.api";
import { PageHeader } from "../components/ui/DashboardGrid";
import DataTable, { type Column } from "../components/ui/DataTable";
import { RAGBadge, projectStatusToRAG, goLiveToRAG } from "../components/ui/RAGBadge";

const columns: Column<Project>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "code", header: "Code", sortable: true },
  { key: "manager", header: "Manager", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (p) => <RAGBadge status={projectStatusToRAG(p.status)} label={p.status.replace(/_/g, " ")} />,
  },
  {
    key: "initialBudget",
    header: "Budget (K€)",
    sortable: true,
    className: "text-right font-mono",
    render: (p) => `${((p.initialBudget || 0) / 1000).toFixed(0)}K`,
  },
  {
    key: "consumedBudget",
    header: "Consumed (K€)",
    sortable: true,
    className: "text-right font-mono",
    render: (p) => `${((p.consumedBudget || 0) / 1000).toFixed(0)}K`,
  },
  {
    key: "slippageMd",
    header: "Slippage",
    sortable: true,
    className: "text-right",
    render: (p) => `${p.slippageMd || 0}d`,
  },
  {
    key: "goLiveReadinessState",
    header: "Go-Live",
    render: (p) => <RAGBadge status={goLiveToRAG(p.goLiveReadinessState)} label={p.goLiveReadinessState} />,
  },
];

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page, limit, search],
    queryFn: () => projectApi.list({ page, limit, search }),
  });

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage and monitor project portfolio"
        icon={Briefcase}
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyIcon={Briefcase}
        emptyTitle="No projects found"
        emptyDescription="Create a project to get started"
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={setPage}
      />
    </div>
  );
}
