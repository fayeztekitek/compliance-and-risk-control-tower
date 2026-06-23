import { useState } from "react";
import {
  ArrowLeft, Bug, Shield, AlertTriangle, CheckCircle, XCircle, Clock,
  ExternalLink, FileText, Layers, Package, Hash, Server, Tag, Activity,
  PlusCircle, Send, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { useOccurrenceDetail, useProposeMitigation, useApproveMitigation, useVerifyMitigation, useCloseMitigation, useRejectMitigation } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mitigationSchema, type MitigationForm } from "../schemas/forms";
import { FormInput, FormSelect, FormTextarea } from "../components/ui/FormField";

interface Props {
  occurrenceId: string;
  applicationName?: string;
  reportId?: string;
  findingId?: string;
  onBackToVuln: () => void;
  onBackToReport: () => void;
  onBackToApp: () => void;
  onBackToOverview: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-100", HIGH: "text-orange-600 bg-orange-100",
  MEDIUM: "text-amber-600 bg-amber-100", LOW: "text-slate-600 bg-slate-100",
};

const MIT_STATUS_COLORS: Record<string, string> = {
  PROPOSED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-teal-100 text-teal-700", CLOSED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const OCC_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-red-100 text-red-700", MITIGATED: "bg-emerald-100 text-emerald-700",
  WAIVED: "bg-purple-100 text-purple-700", ACCEPTED: "bg-amber-100 text-amber-700",
  FIXED: "bg-emerald-100 text-emerald-700",
};

export default function NexusOccurrenceDetail({ occurrenceId, onBackToVuln, onBackToReport, onBackToApp, onBackToOverview }: Props) {
  const { data: detail, isLoading } = useOccurrenceDetail(occurrenceId);
  const [showMitForm, setShowMitForm] = useState(false);
  const [verifyEvidence, setVerifyEvidence] = useState("");
  const [verifyMitId, setVerifyMitId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMitId, setRejectMitId] = useState<string | null>(null);

  const mitForm = useForm<MitigationForm>({
    resolver: zodResolver(mitigationSchema),
    defaultValues: { mitigationType: "FIX" },
  });
  const { register: mitReg, handleSubmit: mitHandleSubmit, formState: { errors: mitErrors }, reset: mitReset } = mitForm;

  const proposeMit = useProposeMitigation();
  const approveMit = useApproveMitigation();
  const verifyMit = useVerifyMitigation();
  const closeMit = useCloseMitigation();
  const rejectMit = useRejectMitigation();

  if (isLoading) return <SkeletonPage />;
  if (!detail) {
    return (
      <div className="text-center py-16 text-slate-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>Occurrence not found</p>
      </div>
    );
  }

  const { occurrence, component, finding, mitigations, waivers } = detail;
  const activeWaiver = waivers.find((w: any) => w.status === "active");

  async function handlePropose(data: MitigationForm) {
    if (!finding) return;
    await proposeMit.mutateAsync({
      findingId: finding.id,
      mitigationType: data.mitigationType,
      targetComponentVersion: data.targetComponentVersion || undefined,
      owner: data.owner || undefined,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
    });
    setShowMitForm(false);
    mitReset();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        <button onClick={onBackToOverview} className="hover:text-indigo-600">Nexus IQ</button>
        <span>/</span>
        <button onClick={onBackToApp} className="hover:text-indigo-600">Application</button>
        <span>/</span>
        <button onClick={onBackToReport} className="hover:text-indigo-600">Report</button>
        <span>/</span>
        <button onClick={onBackToVuln} className="hover:text-indigo-600">Vulnerability</button>
        <span>/</span>
        <span className="text-slate-800 font-medium">Occurrence</span>
      </nav>

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBackToVuln} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <Layers className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {component?.componentName || component?.artifactId || "Unknown Component"}
            </h1>
            <p className="text-sm text-slate-500">
              v{component?.version || "?"} · {occurrence.path || occurrence.module || "Unknown path"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Occurrence Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Occurrence Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Path</p>
                <p className="font-mono text-xs text-slate-800 mt-1">{occurrence.path || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500">Module</p>
                <p className="text-slate-800 mt-1">{occurrence.module || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500">Scope</p>
                <p className="text-slate-800 mt-1">{occurrence.scope || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${OCC_STATUS_COLORS[occurrence.occurrenceStatus] || "bg-slate-100 text-slate-600"}`}>
                  {occurrence.occurrenceStatus}
                </span>
              </div>
              {occurrence.firstDetectedDate && (
                <div>
                  <p className="text-slate-500">First Detected</p>
                  <p className="text-slate-800 mt-1">{new Date(occurrence.firstDetectedDate).toLocaleDateString()}</p>
                </div>
              )}
              {occurrence.lastDetectedDate && (
                <div>
                  <p className="text-slate-500">Last Detected</p>
                  <p className="text-slate-800 mt-1">{new Date(occurrence.lastDetectedDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Component Details */}
          {component && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Component
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Name</p>
                  <p className="text-slate-800 mt-1 font-medium">{component.componentName || component.artifactId || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Version</p>
                  <p className="text-slate-800 mt-1">{component.version}</p>
                </div>
                {component.groupId && (
                  <div className="col-span-2">
                    <p className="text-slate-500">Group ID</p>
                    <p className="text-slate-800 mt-1 font-mono text-xs">{component.groupId}</p>
                  </div>
                )}
                {component.packageUrl && (
                  <div className="col-span-2">
                    <p className="text-slate-500">Package URL</p>
                    <p className="text-slate-800 mt-1 font-mono text-xs break-all">{component.packageUrl}</p>
                  </div>
                )}
                {component.licenseType && (
                  <div>
                    <p className="text-slate-500">License</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mt-1">
                      {component.licenseType}
                    </span>
                  </div>
                )}
                {component.hash && (
                  <div>
                    <p className="text-slate-500">Hash</p>
                    <p className="font-mono text-xs text-slate-600 mt-1 truncate max-w-[200px]" title={component.hash}>{component.hash.slice(0, 20)}...</p>
                  </div>
                )}
              </div>

              {/* Fix Available */}
              {finding?.fixAvailable && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      Fix available{finding.recommendedVersion ? `: upgrade to ${finding.recommendedVersion}` : ""}
                    </span>
                  </div>
                </div>
              )}

              {!finding?.fixAvailable && component && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">No fix available yet — consider waiver or mitigation</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linked Finding */}
          {finding && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Bug className="w-4 h-4" /> Linked Vulnerability
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">CVE / ID</p>
                  <p className="font-mono text-sm text-indigo-600 font-medium mt-1">{finding.cveId || finding.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Severity</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${SEVERITY_COLORS[finding.unifiedSeverity] || "bg-slate-100 text-slate-600"}`}>
                    {finding.unifiedSeverity}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500">CVSS</p>
                  <p className="text-slate-800 mt-1 font-medium">{finding.cvssScore ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="text-slate-800 mt-1">{finding.status}</p>
                </div>
                {finding.epssScore !== undefined && finding.epssScore !== null && (
                  <div>
                    <p className="text-slate-500">EPSS Score</p>
                    <p className="text-slate-800 mt-1">{(finding.epssScore * 100).toFixed(2)}%</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">CISA KEV</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${finding.cisaKev ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                    {finding.cisaKev ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mitigations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Mitigations ({mitigations.length})
              </h3>
              <button onClick={() => setShowMitForm(!showMitForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                <PlusCircle className="w-4 h-4" /> Propose
              </button>
            </div>

            {showMitForm && (
              <form onSubmit={mitHandleSubmit(handlePropose)} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormSelect label="Type" registration={mitReg("mitigationType")} error={mitErrors.mitigationType} options={[{value:"FIX",label:"Fix"},{value:"UPGRADE",label:"Upgrade"},{value:"PATCH",label:"Patch"},{value:"WORKAROUND",label:"Workaround"},{value:"ACCEPT",label:"Accept Risk"}]} />
                  <FormInput label="Owner" registration={mitReg("owner")} error={mitErrors.owner} placeholder="Assignee" />
                  <FormInput label="Target Version" registration={mitReg("targetComponentVersion")} error={mitErrors.targetComponentVersion} placeholder="e.g. 2.1.0" />
                  <FormInput label="Due Date" registration={mitReg("dueDate")} error={mitErrors.dueDate} type="date" />
                </div>
                <FormTextarea label="Notes" registration={mitReg("notes")} error={mitErrors.notes} rows={2} placeholder="Optional notes" />
                <div className="flex gap-2">
                  <button type="submit" disabled={proposeMit.isPending}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    <Send className="w-3 h-3" /> {proposeMit.isPending ? "Submitting..." : "Submit"}
                  </button>
                  <button type="button" onClick={() => setShowMitForm(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                </div>
              </form>
            )}

            {mitigations.length > 0 ? (
              <div className="space-y-3">
                {mitigations.map((mit: any) => (
                  <div key={mit.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${MIT_STATUS_COLORS[mit.status] || "bg-slate-100 text-slate-600"}`}>
                          {mit.status}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{mit.mitigationType}</span>
                      </div>
                      <div className="flex gap-1">
                        {mit.status === "PROPOSED" && (
                          <>
                            <button onClick={() => approveMit.mutate(mit.id)} className="p-1 rounded hover:bg-green-100 text-green-600" title="Approve">
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setRejectMitId(mit.id); }} className="p-1 rounded hover:bg-red-100 text-red-600" title="Reject">
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {mit.status === "IN_PROGRESS" && (
                          <button onClick={() => setVerifyMitId(mit.id)} className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700">Verify</button>
                        )}
                        {mit.status === "VERIFIED" && (
                          <button onClick={() => closeMit.mutate(mit.id)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">Close</button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                      {mit.owner && <div><span className="font-medium text-slate-600">Owner:</span> {mit.owner}</div>}
                      {mit.targetComponentVersion && <div><span className="font-medium text-slate-600">Target:</span> {mit.targetComponentVersion}</div>}
                      {mit.dueDate && <div><span className="font-medium text-slate-600">Due:</span> {new Date(mit.dueDate).toLocaleDateString()}</div>}
                    </div>
                    {mit.notes && <p className="text-xs text-slate-500 mt-2">{mit.notes}</p>}

                    {verifyMitId === mit.id && (
                      <div className="mt-2 flex gap-2">
                        <input value={verifyEvidence} onChange={e => setVerifyEvidence(e.target.value)}
                          className="flex-1 text-xs border border-slate-300 rounded px-2 py-1" placeholder="Evidence of fix..." />
                        <button onClick={() => { verifyMit.mutate({ id: mit.id, evidence: verifyEvidence }); setVerifyMitId(null); setVerifyEvidence(""); }}
                          className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700">Submit</button>
                      </div>
                    )}
                    {rejectMitId === mit.id && (
                      <div className="mt-2 flex gap-2">
                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                          className="flex-1 text-xs border border-slate-300 rounded px-2 py-1" placeholder="Reason for rejection..." />
                        <button onClick={() => { rejectMit.mutate({ id: mit.id, reason: rejectReason }); setRejectMitId(null); setRejectReason(""); }}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No mitigation proposed yet.</p>
            )}
          </div>

          {/* Waivers */}
          {activeWaiver && (
            <div className="bg-white rounded-xl border border-purple-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" /> Active Waiver
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Reason:</span> <span className="text-slate-800">{activeWaiver.reason}</span></div>
                <div><span className="text-slate-500">Approver:</span> <span className="text-slate-800">{activeWaiver.approver || "—"}</span></div>
                {activeWaiver.expirationDate && <div><span className="text-slate-500">Expires:</span> <span className="text-slate-800">{new Date(activeWaiver.expirationDate).toLocaleDateString()}</span></div>}
                {activeWaiver.creationDate && <div><span className="text-slate-500">Created:</span> <span className="text-slate-800">{new Date(activeWaiver.creationDate).toLocaleDateString()}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => setShowMitForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                <Shield className="w-4 h-4" /> Propose Mitigation
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
                <Shield className="w-4 h-4" /> Request Waiver
              </button>
              {finding?.fixAvailable && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm">
                  <p className="font-medium text-emerald-800">Fix Available</p>
                  <p className="text-emerald-600 text-xs mt-1">Upgrade to {finding.recommendedVersion || "latest version"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Occurrence Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Status Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Occurrence</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${OCC_STATUS_COLORS[occurrence.occurrenceStatus] || "bg-slate-100 text-slate-600"}`}>
                  {occurrence.occurrenceStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Mitigations</span>
                <span className="text-sm font-medium">{mitigations.filter((m: any) => m.status === "CLOSED").length}/{mitigations.length} closed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Waiver</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${activeWaiver ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                  {activeWaiver ? "Active" : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Overall</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  occurrence.occurrenceStatus === "ACTIVE" && !mitigations.length && !activeWaiver
                    ? "bg-red-100 text-red-700"
                    : occurrence.occurrenceStatus === "FIXED" || mitigations.some((m: any) => m.status === "CLOSED")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {occurrence.occurrenceStatus === "ACTIVE" && !mitigations.length && !activeWaiver
                    ? "UNHANDLED"
                    : occurrence.occurrenceStatus === "FIXED" || mitigations.some((m: any) => m.status === "CLOSED")
                    ? "RESOLVED"
                    : "IN PROGRESS"}
                </span>
              </div>
            </div>
          </div>

          {/* Component Metadata */}
          {component && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Component Details</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-slate-400" /> {component.componentName || component.artifactId}</p>
                <p className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400" /> v{component.version}</p>
                {component.licenseType && <p className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /> {component.licenseType}</p>}
                {component.packageUrl && <p className="flex items-start gap-2 text-xs"><Server className="w-3.5 h-3.5 text-slate-400 mt-0.5" /> <span className="break-all">{component.packageUrl}</span></p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
