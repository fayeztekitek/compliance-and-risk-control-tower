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
  Sliders,
  AlertTriangle,
  Plus,
  TrendingUp,
  Database,
  Award,
  Calendar,
  FileText,
  UserCheck,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  addAuditTrail,
} from "../store/complianceStore";
import { Project, Roadmap } from "../types";

export default function RoadmapProjectWorkspace() {
  const role = getCurrentRole();
  const rawProjects = store.getProjects();
  const rawRoadmaps = store.getRoadmaps();

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMilestone, setFilterMilestone] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [activeTab, setActiveTab] = useState<"ACTIVE_PROJECTS" | "ROADMAPS" | "RTD_DECLARATION">("ACTIVE_PROJECTS");

  // Selection
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    rawProjects.length > 0 ? rawProjects[0].id : null
  );

  // RTD update states
  const [inputRTD, setInputRTD] = useState<number>(0);
  const [inputComments, setInputComments] = useState("");

  const filteredProjects = rawProjects.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manager.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const selectedProj = rawProjects.find((p) => p.id === selectedProjectId);

  // Sync state on select
  React.useEffect(() => {
    if (selectedProj) {
      setInputRTD(selectedProj.rtdValue);
      setInputComments("");
    }
  }, [selectedProjectId]);

  const handleUpdateRTD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj) return;

    const parsedRTD = parseFloat(inputRTD as any);
    const consumed = selectedProj.consumedBudget;
    const initial = selectedProj.initialBudget;

    // Calculate dynamic deviations and slippages
    const expectedTotal = consumed + parsedRTD;
    const slippage = expectedTotal - initial;
    const deviation = initial > 0 ? (slippage / initial) * 100 : 0;

    let newStatus: "ON_TRACK" | "DEVIATING" | "HIGH_RISK" = "ON_TRACK";
    if (deviation > 15) {
      newStatus = "HIGH_RISK";
    } else if (deviation > 5) {
      newStatus = "DEVIATING";
    }

    const updatedProject: Project = {
      ...selectedProj,
      rtdValue: parsedRTD,
      slippageMD: Math.round(slippage),
      rtdDeviation: parseFloat(deviation.toFixed(1)),
      status: newStatus,
      prodGoLiveReadinessState: deviation > 15 ? "BLOCKED" : deviation > 5 ? "RISKY" : "READY",
    };

    store.saveProject(updatedProject);
    setSelectedProjectId(updatedProject.id);

    addAuditTrail(
      "PROJECT_RTD_RECALCULATED",
      "DELIVERY",
      `Project ${selectedProj.code} declared RTD updated to ${parsedRTD}MD (Deviation ${updatedProject.rtdDeviation}%)`
    );
  };

  const isPmOrOwner = ["ADMIN", "PRODUCT_OWNER", "CONTROLLER", "RISK_MANAGER"].includes(role);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono">
            Roadmaps & Project Monitoring (Chronos MD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor strategic remaining-to-do (RTD), Chronos developer workloads, Project Information Sheets and delivery slippages.
          </p>
        </div>
      </div>

      {/* Segment tabs */}
      <div className="flex space-x-2 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("ACTIVE_PROJECTS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "ACTIVE_PROJECTS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Projects Register ({rawProjects.length})
        </button>
        <button
          onClick={() => setActiveTab("ROADMAPS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "ROADMAPS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Company Strategic Roadmaps ({rawRoadmaps.length})
        </button>
        <button
          onClick={() => setActiveTab("RTD_DECLARATION")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "RTD_DECLARATION" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Chronos Monthly RTD Declaration Engine
        </button>
      </div>

      {activeTab === "ACTIVE_PROJECTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects Register list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm lg:col-span-8 flex flex-col justify-start">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project name, code or manager..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="ON_TRACK">ON TRACK</option>
                  <option value="DEVIATING">DEVIATING</option>
                  <option value="HIGH_RISK">HIGH RISK</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-3.5">Project / Manager</th>
                    <th className="p-3.5">Budget Initial (MD)</th>
                    <th className="p-3.5">Consumed Actual</th>
                    <th className="p-3.5">RTD Declared</th>
                    <th className="p-3.5">Slippage MD</th>
                    <th className="p-3.5">Timeline Deviation</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProjects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-all ${
                        selectedProjectId === p.id ? "bg-indigo-50/40 font-bold" : ""
                      }`}
                    >
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold font-mono text-slate-400 block">{p.code}</span>
                        <strong className="text-slate-700 block mt-0.5 truncate max-w-[140px]">{p.name}</strong>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">{p.manager}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{p.initialBudget}</td>
                      <td className="p-3.5 font-mono text-slate-600">{p.consumedBudget}</td>
                      <td className="p-3.5 font-mono text-indigo-650">{p.rtdValue}</td>
                      <td className={`p-3.5 font-mono ${p.slippageMD > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {p.slippageMD > 0 ? `+${p.slippageMD}` : p.slippageMD}
                      </td>
                      <td className={`p-3.5 font-mono ${p.rtdDeviation > 10 ? "text-rose-600 font-bold" : p.rtdDeviation > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {p.rtdDeviation}%
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          p.status === "ON_TRACK"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            : p.status === "DEVIATING"
                            ? "bg-amber-50 text-amber-800 border border-amber-100"
                            : "bg-rose-50 text-rose-800 border border-rose-100 animate-pulse"
                        }`}>
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Sheet Detail details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-4 flex flex-col justify-between">
            {selectedProj ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-secondary-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400">GUIDANCE INFORMATION SHEET • {selectedProj.code}</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">{selectedProj.name}</h3>
                </div>

                {/* Automation review */}
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">TEST AUTOMATION COVERAGE</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-slate-200 h-2 rounded overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${selectedProj.testAutomationRate}%` }}></div>
                      </div>
                      <span className="font-mono font-semibold text-slate-700">{selectedProj.testAutomationRate}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">GO-LIVE DEPLOYMENT READINESS</span>
                    <p className={`font-bold mt-1 text-[11px] flex items-center ${
                      selectedProj.prodGoLiveReadinessState === "READY" ? "text-emerald-600" : selectedProj.prodGoLiveReadinessState === "RISKY" ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {selectedProj.prodGoLiveReadinessState === "READY" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1.5" /> APPROVED FOR INTEGRATION
                        </>
                      ) : selectedProj.prodGoLiveReadinessState === "RISKY" ? (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-1.5 animate-bounce" /> PENDING RISK MITIGATION
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1.5" /> TIMELINE OVERRUN BLOCK
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Timeline status list checklist */}
                <div className="text-xs space-y-2">
                  <p className="font-bold text-slate-500 uppercase tracking-widest font-mono">
                    PIS Compliance Checklist
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-650">Project Information Sheet fully signed off</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-650">Baseline initial budget logged (Chronos)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedProj.testAutomationRate >= 70 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="text-slate-650">Test Automation rates &gt; 70% threshold ({selectedProj.testAutomationRate}%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedProj.status !== "HIGH_RISK" ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                      )}
                      <span className="text-slate-650">Deviation below 15% threshold ({selectedProj.rtdDeviation}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-mono text-xs">
                Select an active project code to analyze metrics.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ROADMAPS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Strategic & Regulatory Company Roadmaps
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">High level milestones approved by the ExCo covering structural, compliance or security upgrades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rawRoadmaps.map((rm) => (
              <div key={rm.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-indigo-400 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded">
                      {rm.type}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                      rm.milestoneStatus === "ON_TIME" ? "bg-emerald-100 text-emerald-800" : rm.milestoneStatus === "DELAYED" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {rm.milestoneStatus}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm leading-tight">{rm.name}</h4>
                  <p className="text-[11px] text-slate-450 mt-1 font-semibold">Lead: {rm.leadOwner}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-150 space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Milestone Progress</span>
                      <span>{rm.progress}%</span>
                    </div>
                    <div className="bg-slate-200 h-1.5 rounded overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${rm.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>ID: {rm.id}</span>
                    <span>Target Date: {rm.targetDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "RTD_DECLARATION" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Monthly Chronos RTD Control Center
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Declare remaining-to-do estimates on active deliverable pipelines to calculate live budget variance risks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-2.5">
              <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Target Project</label>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-2">
                {rawProjects.map((p) => {
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer text-left transition-all ${
                        selectedProjectId === p.id
                          ? "bg-indigo-50 border-indigo-400 font-bold"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400">{p.code}</span>
                        <span className="font-mono font-bold text-slate-705">{p.rtdValue} MD Remaining</span>
                      </div>
                      <p className="text-slate-750 font-bold mt-1 leading-tight">{p.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-7 bg-slate-50 p-5 rounded-xl border border-slate-200">
              {selectedProj ? (
                <form onSubmit={handleUpdateRTD} className="space-y-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">ACTIVE SELECTED COMPONENT</p>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">{selectedProj.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">PM Manager Owner: {selectedProj.manager}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-150 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">INITIAL BUDGET</span>
                      <p className="font-bold text-slate-700 font-mono">{selectedProj.initialBudget} MD</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">ACTUAL CONSUMED</span>
                      <p className="font-bold text-slate-700 font-mono">{selectedProj.consumedBudget} MD</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">CURRENT SLIPPAGE</span>
                      <p className={`font-bold font-mono ${selectedProj.slippageMD > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {selectedProj.slippageMD > 0 ? `+${selectedProj.slippageMD}` : selectedProj.slippageMD} MD
                      </p>
                    </div>
                  </div>

                  {isPmOrOwner ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold font-mono">
                          <label className="text-slate-500 uppercase">DECLARATIVE RTD VALUE (MAN-DAYS)</label>
                          <span className="text-indigo-600 font-extrabold text-sm">{inputRTD} MD</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={selectedProj.initialBudget}
                          value={inputRTD}
                          onChange={(e) => setInputRTD(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase font-mono">Justification justification (Chronos record)</label>
                        <textarea
                          placeholder="Ex. Scope amendments on Palmyra framework, regression validations, client-requested delays..."
                          rows={2}
                          value={inputComments}
                          onChange={(e) => setInputComments(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm cursor-pointer"
                        >
                          SUBMIT CHRONOS UPDATE
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded border border-amber-100 text-xs text-amber-800">
                      You are logged in as {role}. Only Authorized PM Managers or Risk Controllers can write Chronos RTD estimates.
                    </div>
                  )}
                </form>
              ) : (
                <div className="py-20 text-center text-slate-400 font-mono text-xs">
                  Highlight an active project from the list to launch the RTD calculation slider.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
