import { Database, Zap, Sprout, Bug } from "lucide-react";

export type DataSourceType = "LIVE_API" | "DATABASE_CACHE" | "SEED_DATA" | "MOCK_DATA";

const config: Record<DataSourceType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  LIVE_API: { label: "Live API", icon: Zap, color: "text-green-700", bg: "bg-green-100" },
  DATABASE_CACHE: { label: "Database Cache", icon: Database, color: "text-blue-700", bg: "bg-blue-100" },
  SEED_DATA: { label: "Seed Data", icon: Sprout, color: "text-amber-700", bg: "bg-amber-100" },
  MOCK_DATA: { label: "Mock Data", icon: Bug, color: "text-red-700", bg: "bg-red-100" },
};

export function DataSourceIndicator({ source }: { source: DataSourceType }) {
  const c = config[source];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}
