import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "./DashboardGrid";

interface PortfolioAnalyticsProps {
  roadmapId?: string;
}

export function PortfolioBudgetChart({ roadmapId }: PortfolioAnalyticsProps) {
  const { data } = useQuery({
    queryKey: ["portfolio-budget", roadmapId],
    queryFn: async () => {
      const { dashboardApi } = await import("../../api/dashboard.api");
      const res = await dashboardApi.executive();
      return res.data?.kpis || {};
    },
    refetchInterval: 60000,
  });

  const budgetData = [
    { name: "Budget", value: (data as any)?.totalBudget || 0 },
    { name: "Consumed", value: (data as any)?.totalConsumed || 0 },
  ];

  return (
    <ChartCard title="Portfolio Budget Overview">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={budgetData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PortfolioSummaryProps {
  totalRoadmaps: number;
  totalProjects: number;
  totalBudget: number;
  totalConsumed: number;
  avgProgress: number;
}

export function PortfolioSummaryCard({ totalRoadmaps, totalProjects, totalBudget, totalConsumed, avgProgress }: PortfolioSummaryProps) {
  const utilization = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Portfolio Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Roadmaps</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{totalRoadmaps}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Projects</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{totalProjects}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Progress</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{avgProgress}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Budget Used</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{utilization}%</p>
        </div>
      </div>
    </div>
  );
}
