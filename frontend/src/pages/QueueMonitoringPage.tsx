import { useQueueStatuses, useRetryQueue, useCleanQueue } from "../hooks/useQueueMonitoring";
import { SkeletonTable } from "../components/ui/Skeleton";

const QUEUE_LABELS: Record<string, string> = {
  nexusSync: "Nexus Sync",
  slaBreach: "SLA Breach",
  waiverExpiry: "Waiver Expiry",
  emailNotify: "Email Notify",
  kpiRecalc: "KPI Recalc",
  enrichment: "Enrichment",
  vegSlaCheck: "VEG SLA Check",
};

function QueueRow({ q }: { q: { queue: string; waiting: number; active: number; completed: number; failed: number } }) {
  const retry = useRetryQueue(q.queue);
  const clean = useCleanQueue(q.queue);

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      <td className="py-3 px-4 font-medium">{QUEUE_LABELS[q.queue] || q.queue}</td>
      <td className="py-3 px-4 text-center"><span className="px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-700">{q.waiting}</span></td>
      <td className="py-3 px-4 text-center"><span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{q.active}</span></td>
      <td className="py-3 px-4 text-center"><span className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">{q.completed}</span></td>
      <td className="py-3 px-4 text-center"><span className={`px-2 py-1 rounded text-xs ${q.failed > 0 ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" : "bg-slate-100 dark:bg-slate-700"}`}>{q.failed}</span></td>
      <td className="py-3 px-4 text-center space-x-2">
        {q.failed > 0 && <button onClick={() => retry.mutate()} className="px-3 py-1 text-xs rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200" aria-label={`Retry ${q.queue}`}>Retry</button>}
        <button onClick={() => clean.mutate()} className="px-3 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label={`Clean ${q.queue}`}>Clean</button>
      </td>
    </tr>
  );
}

export default function QueueMonitoringPage() {
  const { data: queues, isLoading, refetch } = useQueueStatuses();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Queue Monitoring</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live BullMQ queue statuses (auto-refreshes every 10s)</p>
        </div>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700" aria-label="Refresh queue statuses">Refresh</button>
      </div>

      {isLoading ? <SkeletonTable rows={7} cols={6} /> : (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Queue</th>
                <th className="text-center py-3 px-4 font-medium">Waiting</th>
                <th className="text-center py-3 px-4 font-medium">Active</th>
                <th className="text-center py-3 px-4 font-medium">Completed</th>
                <th className="text-center py-3 px-4 font-medium">Failed</th>
                <th className="text-center py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-200">
              {queues?.map(q => <QueueRow key={q.queue} q={q} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
