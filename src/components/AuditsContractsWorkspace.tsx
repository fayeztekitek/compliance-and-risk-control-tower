/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  Plus,
  Scale,
  FileCheck,
  Percent,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  addAuditTrail,
} from "../store/complianceStore";
import { AuditFinding, CorrectiveAction, ContractualObligation } from "../types";

export default function AuditsContractsWorkspace() {
  const role = getCurrentRole();
  const rawFindings = store.getAuditFindings();
  const rawActions = store.getCorrectiveActions();
  const rawContracts = store.getContractualObligations();

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const [activeTab, setActiveTab] = useState<"CAPA_CENTER" | "AUDIT_FINDINGS" | "CONTRACT_OBLIGATIONS">("CAPA_CENTER");

  const [selectedActionId, setSelectedActionId] = useState<string | null>(
    rawActions.length > 0 ? rawActions[0].id : null
  );

  const filteredActions = rawActions.filter((a) => {
    const matchesQuery =
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.owner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "ALL" || a.findingId === filterType;
    const matchesOverdue = !showOverdueOnly || a.status === "OVERDUE";

    return matchesQuery && matchesType && matchesOverdue;
  });

  const selectedAction = rawActions.find((a) => a.id === selectedActionId);

  const isAuditorOrComp = ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER"].includes(role);

  const handleCloseCAPA = (actionId: string) => {
    const action = rawActions.find((a) => a.id === actionId);
    if (!action) return;

    const updated: CorrectiveAction = {
      ...action,
      status: "COMPLETED",
      completionDate: new Date().toISOString().split("T")[0],
    };

    store.saveCorrectiveAction(updated);
    addAuditTrail(
      "CAPA_CLOSURE",
      "AUDITS",
      `Closed Corrective Action ${actionId} - marked as COMPLETED.`
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono">
            Audits & Contractual Obligations (CAPA Center)
          </h2>
          <p className="text-xs text-slate-505 mt-0.5">
            Coordinate ISO 27000 or ISAE 3402 findings, track corrective action plans (CAPAs), and monitor customer audit SLA penalty risks.
          </p>
        </div>
      </div>

      {/* Segment tabs */}
      <div className="flex space-x-2 p-1 bg-slate-100 border border-slate-205 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("CAPA_CENTER")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "CAPA_CENTER" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Corrective Action Center (CAPA) ({rawActions.length})
        </button>
        <button
          onClick={() => setActiveTab("AUDIT_FINDINGS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "AUDIT_FINDINGS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-505 hover:text-slate-800"
          }`}
        >
          External Findings Registry ({rawFindings.length})
        </button>
        <button
          onClick={() => setActiveTab("CONTRACT_OBLIGATIONS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "CONTRACT_OBLIGATIONS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-505 hover:text-slate-800"
          }`}
        >
          Client Obligations & Penalties ({rawContracts.length})
        </button>
      </div>

      {activeTab === "CAPA_CENTER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left table of CAPAs */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm lg:col-span-8 flex flex-col justify-start">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search actions or assignees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-705 font-semibold focus:outline-none focus:border-indigo-505"
                />
              </div>
              <div className="flex space-x-2 items-center">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-650 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Finding ID Sources</option>
                  <option value="FIND-2026-001">SYS-KEY-ROT (Access)</option>
                  <option value="FIND-2026-002">DPA-GDPR (Privacy)</option>
                  <option value="FIND-2026-003">BACKUP-ERR (SaaS Backup)</option>
                </select>

                <button
                  onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    showOverdueOnly
                      ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Show Overdue Only
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-3.5">CAPA Action ID</th>
                    <th className="p-3.5">Action Item Target Description</th>
                    <th className="p-3.5">Assignee</th>
                    <th className="p-3.5 text-center">Plan Due Date</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredActions.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedActionId(a.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-all ${
                        selectedActionId === a.id ? "bg-indigo-50/40 font-bold" : ""
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-indigo-650">{a.id}</td>
                      <td className="p-3.5 text-slate-705 max-w-[250px] truncate">{a.description}</td>
                      <td className="p-3.5 text-slate-700">{a.owner}</td>
                      <td className="p-3.5 text-center font-mono text-slate-600">{a.dueDate}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          a.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredActions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold font-mono">
                        No corrective plans detected within active guidelines.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right details of CAPA */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-4 flex flex-col justify-between">
            {selectedAction ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{selectedAction.id} • Source: {selectedAction.findingId}</span>
                  <p className="font-bold text-slate-755 text-xs mt-1 leading-relaxed">"{selectedAction.description}"</p>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono block">RESPONSIBLE OWNER</span>
                    <p className="font-semibold text-slate-755 mt-0.5">{selectedAction.owner}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono block">TARGET CLOSURE SLA BOUND</span>
                    <p className="font-mono font-semibold text-rose-650 mt-0.5">{selectedAction.dueDate}</p>
                  </div>
                  {selectedAction.completionDate && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono block">ACTUAL INTEGRATION CLOSURE DATE</span>
                      <p className="font-mono font-semibold text-emerald-600 mt-0.5">{selectedAction.completionDate}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {isAuditorOrComp && selectedAction.status !== "COMPLETED" ? (
                    <button
                      onClick={() => handleCloseCAPA(selectedAction.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
                    >
                      SOLVE & FLAG REMEDIATED
                    </button>
                  ) : selectedAction.status === "COMPLETED" ? (
                    <div className="flex items-center justify-center p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-xs font-bold space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>CAPA Closed Successfully • Verified</span>
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-slate-400 font-mono italic leading-snug bg-slate-50 p-2 text-center rounded">
                      Contact logged Auditor ({selectedAction.owner}) to close corrective plans.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-405 font-mono text-xs">
                Select a corrective plan row from the list to display parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "AUDIT_FINDINGS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-804 uppercase tracking-wider font-mono">
              Regulatory Audit Findings Log
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Identified deficient areas documented inside external regulatory auditing protocols.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rawFindings.map((f) => {
              const matchingCAPAs = rawActions.filter((a) => a.findingId === f.id);
              const openCAPAs = matchingCAPAs.filter((a) => a.status !== "COMPLETED").length;

              return (
                <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-indigo-400 transition-all text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-605">{f.id}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                        f.severity === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {f.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-755 leading-tight text-sm">{f.title}</h4>
                    <p className="text-slate-600 leading-relaxed italic">"{f.description}"</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-[11px] text-slate-450">
                    <p>Auditor Scope: <strong className="text-slate-600">{f.targetEntity}</strong></p>
                    <p>Reference Directive: <span className="font-mono text-indigo-650">{f.id}</span></p>
                    <div className="flex justify-between items-center font-mono text-[10px] pt-1.5 mt-1.5 border-t border-dashed border-slate-200">
                      <span>{matchingCAPAs.length} registered CAPAs</span>
                      <span className={`font-bold ${openCAPAs > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {openCAPAs} Open Expose-targets
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "CONTRACT_OBLIGATIONS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center">
              <Scale className="w-4.5 h-4.5 mr-2 text-indigo-505" />
              Sovereign Sovereign Contracts & Audit prep limits
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Track Client platform commitments, penalty risk triggers, and verification targets.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-650">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-3.5">Obligation Reference</th>
                  <th className="p-3.5">Contractual Obligation Guidelines</th>
                  <th className="p-3.5 text-center">Interval Term</th>
                  <th className="p-3.5 font-mono">Contract Detail Source</th>
                  <th className="p-3.5">Verified Principal</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-sans">
                {rawContracts.map((con) => (
                  <tr key={con.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <strong className="text-slate-800 block">{con.id}</strong>
                      <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase mt-0.5">{con.title}</span>
                    </td>
                    <td className="p-3.5 text-slate-655 max-w-[280px] leading-snug">{con.requirement}</td>
                    <td className="p-3.5 text-center font-semibold text-slate-700 bg-slate-50/50">{con.frequency}</td>
                    <td className="p-3.5 font-mono text-indigo-650 font-bold">{con.sourceContract}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{con.verifiedBy}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        con.status === "COMPLIANT"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-150"
                          : "bg-rose-100 text-rose-800 border border-rose-150 animate-pulse"
                      }`}>
                        {con.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
