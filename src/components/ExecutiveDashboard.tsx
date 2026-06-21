/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  Flame,
  Clock,
  Briefcase,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import {
  calculateKPIs,
  calculateKRIs,
  store,
} from "../store/complianceStore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export default function ExecutiveDashboard() {
  const kpis = calculateKPIs();
  const kris = calculateKRIs();

  // Get raw items to list major exposures
  const vulnerabilities = store.getVulnerabilities().filter((v) => v.status === "OPEN");
  const projects = store.getProjects();
  const activeWaivers = store.getWaivers().filter((w) => w.status === "APPROVED");
  const upcomingCommittees = store.getCommittees().filter((c) => c.status === "PLANNED");

  // Selected cell filter in 5x5 matrix
  const [selectedCell, setSelectedCell] = useState<{ severity: string; likelihood: string } | null>(null);

  // --- Dynamic 5x5 Heatmap Calculator ---
  // Likelihood (1-5):
  // 5 (Almost Certain): SLA Overdue
  // 4 (Likely): SLA expires within 15 days
  // 3 (Moderate): SLA expires in 15-45 days
  // 2 (Unlikely): SLA expires in 45-90 days
  // 1 (Rare): SLA has >90 days or waived
  // Severity (1-5):
  // 5 (Severe): Critical Severity
  // 4 (Major): High Severity
  // 3 (Moderate): Medium Severity
  // 2 (Minor): Low Severity
  // 1 (Insignificant): Waived / FP
  const calculateHeatmapCoords = () => {
    // Grid coordinate count initial state
    const grid: Record<string, Record<string, any[]>> = {
      "5": { "1": [], "2": [], "3": [], "4": [], "5": [] },
      "4": { "1": [], "2": [], "3": [], "4": [], "5": [] },
      "3": { "1": [], "2": [], "3": [], "4": [], "5": [] },
      "2": { "1": [], "2": [], "3": [], "4": [], "5": [] },
      "1": { "1": [], "2": [], "3": [], "4": [], "5": [] },
    };

    const allVulns = store.getVulnerabilities();
    const anchorTime = new Date("2026-06-10").getTime();

    allVulns.forEach((v) => {
      let sevCoord = "1";
      if (v.status === "FALSE_POSITIVE") {
        sevCoord = "1";
      } else {
        switch (v.severity) {
          case "CRITICAL":
            sevCoord = "5";
            break;
          case "HIGH":
            sevCoord = "4";
            break;
          case "MEDIUM":
            sevCoord = "3";
            break;
          case "LOW":
            sevCoord = "2";
            break;
        }
      }

      let likeCoord = "1";
      if (v.status === "REMEDIATED" || v.status === "WAIVED") {
        likeCoord = "1";
      } else {
        const dueTime = new Date(v.slaDueDate).getTime();
        const diffDays = (dueTime - anchorTime) / (1000 * 60 * 60 * 24);

        if (diffDays < 0) {
          likeCoord = "5"; // Overdue
        } else if (diffDays <= 15) {
          likeCoord = "4"; // Highly Proximity
        } else if (diffDays <= 45) {
          likeCoord = "3"; // Medium
        } else if (diffDays <= 90) {
          likeCoord = "2"; // Low proximity
        } else {
          likeCoord = "1";
        }
      }

      grid[sevCoord][likeCoord].push(v);
    });

    return grid;
  };

  const heatmapData = calculateHeatmapCoords();

  // Selected cell vulnerabilities
  const filteredCellVulns = selectedCell
    ? heatmapData[selectedCell.severity]?.[selectedCell.likelihood] || []
    : [];

  // Recharts: Vulnerabilities scanner breakdown
  const veracodeVulns = vulnerabilities.filter((v) => v.sourceScanner === "VERACODE").length;
  const nexposeVulns = vulnerabilities.filter((v) => v.sourceScanner === "NEXPOSE").length;
  const penTestVulns = vulnerabilities.filter((v) => v.sourceScanner === "PEN_TEST").length;

  const scannerChartData = [
    { name: "Veracode Static", Critical: vulnerabilities.filter((v) => v.sourceScanner === "VERACODE" && v.severity === "CRITICAL").length, High: vulnerabilities.filter((v) => v.sourceScanner === "VERACODE" && v.severity === "HIGH").length, MediumHigh: vulnerabilities.filter((v) => v.sourceScanner === "VERACODE" && (v.severity === "MEDIUM" || v.severity === "LOW")).length },
    { name: "Nexpose Infra", Critical: vulnerabilities.filter((v) => v.sourceScanner === "NEXPOSE" && v.severity === "CRITICAL").length, High: vulnerabilities.filter((v) => v.sourceScanner === "NEXPOSE" && v.severity === "HIGH").length, MediumHigh: vulnerabilities.filter((v) => v.sourceScanner === "NEXPOSE" && (v.severity === "MEDIUM" || v.severity === "LOW")).length },
    { name: "Ex PenTest", Critical: vulnerabilities.filter((v) => v.sourceScanner === "PEN_TEST" && v.severity === "CRITICAL").length, High: vulnerabilities.filter((v) => v.sourceScanner === "PEN_TEST" && v.severity === "HIGH").length, MediumHigh: vulnerabilities.filter((v) => v.sourceScanner === "PEN_TEST" && (v.severity === "MEDIUM" || v.severity === "LOW")).length },
  ];

  // Recharts: Project RTD deviations
  const rtdChartData = projects.map((p) => ({
    name: p.code,
    "RTD Value (MD)": p.rtdValue,
    "Deviation %": p.rtdDeviation,
    "Slippage (MD)": p.slippageMD,
  }));

  // Style helper for Risk level in 5x5 cells
  const getHeatmapColorClass = (sev: number, lik: number, count: number) => {
    const score = sev * lik;
    if (count === 0) return "bg-slate-50 border border-slate-100 text-slate-300 hover:bg-slate-100";
    if (score >= 15) return "bg-rose-500 text-white font-bold animate-pulse hover:brightness-110";
    if (score >= 8) return "bg-amber-500 text-white font-bold hover:brightness-110";
    if (score >= 4) return "bg-yellow-400 text-slate-800 font-bold hover:brightness-110";
    return "bg-emerald-500 text-white font-medium hover:brightness-110";
  };

  const criticalIssues = vulnerabilities.filter(
    (v) => v.severity === "CRITICAL" || (v.severity === "HIGH" && v.status === "OPEN")
  ).slice(0, 5);

  // --- Yesterday's Pending Items (June 9, 2026) Calculation Engine ---
  const pendingVegYesterday = store.getVEGRequests().filter((r) => {
    const isPriorOrSame = new Date(r.date) <= new Date("2026-06-09");
    const hasPendingDecision = r.bidDecision === "PENDING" || r.goNoGoDecision === "PENDING" ||
                               r.financeState === "PENDING" || r.salesState === "PENDING" ||
                               r.productState === "PENDING" || r.legalState === "PENDING";
    return isPriorOrSame && hasPendingDecision;
  });

  const pendingWaiversYesterday = store.getWaivers().filter((w) => {
    const isPriorOrSame = new Date(w.requestDate) <= new Date("2026-06-09");
    return isPriorOrSame && w.status === "PENDING";
  });

  const pendingRiskAcceptancesYesterday = store.getRiskAcceptances().filter((r) => {
    const isPriorOrSame = new Date(r.requestDate) <= new Date("2026-06-09");
    return isPriorOrSame && r.status === "PENDING";
  });

  const pendingSaaSOnboardingYesterday = store.getSaaSApplications().filter((app) => {
    return app.lifecycleStage === "ONBOARDING" && (app.privacyDesignStatus === "PENDING" || !app.steeringCheckPassed);
  });

  const [activePendingTab, setActivePendingTab] = useState<"all" | "veg" | "security" | "saas">("all");
  const [showPendingPanel, setShowPendingPanel] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Welcome Notification banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="relative z-10 space-y-1">
          <p className="text-indigo-400 font-bold tracking-widest uppercase text-[10px] font-mono">EXECUTIVE SUMMARY PORTAL</p>
          <h2 className="text-2xl font-bold tracking-tight">System Compliance & Risk Postures</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Coordinated monitoring covering <strong>{vulnerabilities.length} active application deficiencies</strong>,{" "}
            <strong>{activeWaivers.length} active regulatory waivers</strong>, and <strong>{projects.length} delivery roadmap pipelines</strong>.
          </p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10 flex space-x-2">
          <span className="inline-flex items-center px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded font-mono text-xs font-bold">
            <Flame className="w-4 h-4 mr-1 text-rose-400" />
            {vulnerabilities.filter((v) => v.severity === "CRITICAL").length} RED EXPOSURES
          </span>
          <span className="inline-flex items-center px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded font-mono text-xs font-bold">
            <Clock className="w-4 h-4 mr-1 text-amber-400" />
            {kpis.find((k) => k.id === "kpi-overdue-actions")?.value ?? 0} overdue CAPAs
          </span>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-12 -translate-y-12"></div>
      </div>

      {/* Yesterday's Pending Items Interactive Inquiry Panel */}
      <div id="yesterday-analysis-card" className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              9
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center">
                Yesterday's Outstanding Pending Items Checklist (June 9, 2026)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Analysis of deals, waivers, and audits pending actions or sign-offs chronologically up to yesterday.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPendingPanel(!showPendingPanel)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            {showPendingPanel ? "Collapse Audit" : "Expand Inquiry Report"}
          </button>
        </div>

        {showPendingPanel && (
          <div className="p-5 space-y-4">
            {/* Horizontal Filter Tabs */}
            <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-100">
              <button
                onClick={() => setActivePendingTab("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activePendingTab === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Outstanding ({pendingVegYesterday.length + pendingWaiversYesterday.length + pendingRiskAcceptancesYesterday.length + pendingSaaSOnboardingYesterday.length})
              </button>
              <button
                onClick={() => setActivePendingTab("veg")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activePendingTab === "veg"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                VEG Governance ({pendingVegYesterday.length})
              </button>
              <button
                onClick={() => setActivePendingTab("security")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activePendingTab === "security"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Security Approvals ({pendingWaiversYesterday.length + pendingRiskAcceptancesYesterday.length})
              </button>
              <button
                onClick={() => setActivePendingTab("saas")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activePendingTab === "saas"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                SaaS Onboarding ({pendingSaaSOnboardingYesterday.length})
              </button>
            </div>

            {/* List Element details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
              {/* --- VEG SECTION --- */}
              {(activePendingTab === "all" || activePendingTab === "veg") && pendingVegYesterday.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        VEG GOVERNANCE
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Requested: {r.date}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={r.title}>
                      {r.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Client: <strong>{r.client}</strong> • Owner: {r.owner}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-1 items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600">Pending Signoffs:</span>
                    <div className="flex space-x-1">
                      {r.financeState === "PENDING" && <span className="px-1 bg-yellow-100 text-yellow-800 rounded font-mono font-bold text-[9px]">FIN</span>}
                      {r.salesState === "PENDING" && <span className="px-1 bg-yellow-100 text-yellow-800 rounded font-mono font-bold text-[9px]">SALES</span>}
                      {r.productState === "PENDING" && <span className="px-1 bg-yellow-100 text-yellow-800 rounded font-mono font-bold text-[9px]">PROD</span>}
                      {r.legalState === "PENDING" && <span className="px-1 bg-yellow-100 text-yellow-800 rounded font-mono font-bold text-[9px]">LEGAL</span>}
                      {r.goNoGoDecision === "PENDING" && <span className="px-1 bg-rose-100 text-rose-800 rounded font-mono font-bold text-[9px]">Go/No-Go</span>}
                    </div>
                  </div>
                </div>
              ))}

              {/* --- SECURITY SECTION --- */}
              {(activePendingTab === "all" || activePendingTab === "security") && pendingWaiversYesterday.map((w) => (
                <div key={w.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        SECURITY WAIVER
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Requested: {w.requestDate}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={w.title}>
                      {w.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans line-clamp-2">
                      Rationale: {w.rationale}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600 font-mono">ID: {w.id}</span>
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded">
                      PENDING REVIEW
                    </span>
                  </div>
                </div>
              ))}

              {(activePendingTab === "all" || activePendingTab === "security") && pendingRiskAcceptancesYesterday.map((ra) => (
                <div key={ra.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        RISK ACCEPTANCE
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Requested: {ra.requestDate}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={ra.title}>
                      {ra.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans line-clamp-2">
                      Mitigation: {ra.mitigationPlan}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600 font-mono">ID: {ra.id}</span>
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded">
                      PENDING SIGN-OFF
                    </span>
                  </div>
                </div>
              ))}

              {/* --- SAAS SECTION --- */}
              {(activePendingTab === "all" || activePendingTab === "saas") && pendingSaaSOnboardingYesterday.map((app) => (
                <div key={app.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        SaaS ONBOARDING
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Owner: {app.owner}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={app.name}>
                      {app.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Category: <strong>{app.dataCategory}</strong> • GDPR Impact: <strong>{app.gdprRiskImpact}</strong>
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600">Readiness Score: <strong className="font-mono text-indigo-600">{app.goLiveReadinessScore}%</strong></span>
                    <div className="flex space-x-1.5">
                      {app.privacyDesignStatus === "PENDING" && <span className="px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold rounded uppercase text-[9px]">Privacy Pending</span>}
                      {!app.steeringCheckPassed && <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded uppercase text-[9px]">Steering Pending</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Blocks Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.slice(0, 4).map((kpi) => (
          <div
            key={kpi.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase">
                {kpi.category}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                kpi.status === "CRITICAL"
                  ? "bg-rose-50/70 text-rose-600 border border-rose-100"
                  : kpi.status === "WARNING"
                  ? "bg-amber-50/70 text-amber-600 border border-amber-100"
                  : "bg-emerald-50/70 text-emerald-600 border border-emerald-100"
              }`}>
                {kpi.status}
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight">{kpi.value}{kpi.unit === "%" ? "%" : ""}</p>
              <h3 className="text-xs font-semibold text-slate-600 mt-1">{kpi.name}</h3>
            </div>
            <div className="border-t border-slate-100 mt-4 pt-2.5 flex justify-between items-center text-[11px] text-slate-400">
              <span>Target: {kpi.target !== undefined ? kpi.target : "0"} {kpi.unit}</span>
              <span className={`flex items-center space-x-0.5 font-medium ${kpi.trend === "DOWN" ? "text-emerald-500" : "text-amber-500"}`}>
                <TrendingUp className={`w-3 h-3 ${kpi.trend === "DOWN" ? "rotate-180" : ""}`} />
                <span>{kpi.trend}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive 5x5 Heatmap & Quick Exposure Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heatmap Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center">
                <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                SLA Operational Risk Matrix (5x5 Heatmap)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Deficiencies mapped as Severity (Y) vs Link Proximity Likelihood (X)</p>
            </div>
            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold uppercase cursor-pointer bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded"
              >
                Clear Matrix Filter
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col md:flex-row items-stretch md:space-x-4">
            {/* 5x5 Matrix Layout */}
            <div className="flex-1 select-none">
              <div className="grid grid-cols-6 gap-1.5 text-center text-[10px] font-bold font-mono text-slate-500">
                {/* Y-axis labels columns inside visual blocks */}
                <div className="col-span-1"></div>
                <div>Rare (1)</div>
                <div>Unlikely (2)</div>
                <div>Mod. (3)</div>
                <div>Likely (4)</div>
                <div>Almost Cert (5)</div>

                {/* Grid Rows (5 down to 1) */}
                {(["5", "4", "3", "2", "1"] as string[]).map((y) => {
                  const labelMap: Record<string, string> = {
                    "5": "Severe (5)",
                    "4": "Major (4)",
                    "3": "Moderate (3)",
                    "2": "Minor (2)",
                    "1": "FP/Waive (1)",
                  };

                  return (
                    <React.Fragment key={y}>
                      <div className="flex items-center justify-end pr-2 text-slate-400 leading-none h-11 text-[9px] text-right font-semibold">
                        {labelMap[y]}
                      </div>
                      {(["1", "2", "3", "4", "5"] as string[]).map((x) => {
                        const cellList = heatmapData[y]?.[x] || [];
                        const count = cellList.length;
                        const isSelected = selectedCell?.severity === y && selectedCell?.likelihood === x;

                        return (
                          <div
                            key={x}
                            onClick={() => count > 0 && setSelectedCell({ severity: y, likelihood: x })}
                            className={`h-11 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-sm transition-all relative ${
                              count > 0 ? "cursor-pointer" : "cursor-default"
                            } ${getHeatmapColorClass(parseInt(y), parseInt(x), count)} ${
                              isSelected ? "ring-4 ring-offset-2 ring-indigo-600 scale-105 z-10" : "hover:scale-102"
                            }`}
                          >
                            <span>{count}</span>
                            {count > 0 && (
                              <span className="absolute bottom-0.5 right-1 text-[8px] opacity-75">
                                r{parseInt(y) * parseInt(x)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono mt-4">
                --- SLA Expiry Proximity Likelihood Axis ---
              </div>
            </div>
          </div>

          {/* Dynamic cell viewer */}
          {selectedCell ? (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-700 font-mono flex items-center justify-between">
                <span>
                  CELL EXPOSURES: SEVERITY {selectedCell.severity} × LIKELIHOOD {selectedCell.likelihood} (
                  {filteredCellVulns.length} records)
                </span>
                <span className="text-[10px] text-indigo-600 uppercase font-bold">Diagnosed Filters active</span>
              </p>
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {filteredCellVulns.map((v) => (
                  <div key={v.id} className="bg-white border border-slate-200 rounded p-2 text-xs flex justify-between items-center">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-semibold text-slate-700 truncate">{v.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{v.id} • {v.targetProduct} • SLA: {v.slaDueDate}</p>
                    </div>
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-mono font-bold rounded">
                      {v.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-[11px] text-slate-400 text-center font-mono py-2 bg-slate-50 rounded border border-dashed border-slate-200">
              Click any active block in the matrix above to drill down into corresponding security deficiencies.
            </div>
          )}
        </div>

        {/* Alerts & Critical Exposures Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center mb-4 pb-2 border-b border-slate-100">
              <Briefcase className="w-4.5 h-4.5 mr-2 text-rose-500" />
              Critical Exposures Registry
            </h3>
            <div className="space-y-3">
              {criticalIssues.map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-slate-50 border-l-4 border-rose-500 rounded-r-lg flex items-start justify-between space-x-3 hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate">{v.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {v.id} • {v.targetProduct} • Scanner: {v.sourceScanner}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-mono font-bold rounded">
                      {v.severity}
                    </span>
                    <p className="text-[9px] font-semibold text-slate-500 mt-1 font-mono">SLA: {v.slaDueDate}</p>
                  </div>
                </div>
              ))}
              {criticalIssues.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  No high or critical vulnerabilities detected!
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 mt-4 pt-3.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2">Upcoming Steering Committees</h4>
            <div className="space-y-2">
              {upcomingCommittees.slice(0, 2).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded bg-indigo-50/50 border border-indigo-100">
                  <span className="font-semibold text-slate-700 truncate max-w-[210px] ">{c.name}</span>
                  <span className="flex items-center font-mono text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded font-bold">
                    <Calendar className="w-3 h-3 mr-1" />
                    {c.date}
                  </span>
                </div>
              ))}
              {upcomingCommittees.length === 0 && (
                <p className="text-[11px] text-slate-400 font-mono">No assembly scheduled this cycle.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Security deficiencies Scanner */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-4 text-left">
            Security Deficiencies by Core Scanner Suite
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scannerChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Critical" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="High" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MediumHigh" name="Medium & Low" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: RTD Project deviations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-4 text-left">
            Chronos Project RTD Volume & Variance
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rtdChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRtd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="RTD Value (MD)" stroke="#6366f1" fillOpacity={1} fill="url(#colorRtd)" />
                <Area type="monotone" dataKey="Slippage (MD)" stroke="#f43f5e" fillOpacity={0.2} fill="#f43f5e" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KRIs and financial risk impact blocks */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">
          KEY RISK INDICATORS (KRI) FINANCIAL BREACH LIMITS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kris.map((kri, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{kri.category}</span>
              <h4 className="text-xs font-bold font-sans text-slate-700 leading-tight mt-1">{kri.name}</h4>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-lg font-extrabold font-mono text-slate-800">{kri.value.toLocaleString()} {kri.unit}</span>
                <span className="text-[10px] text-slate-400 font-mono">/ Limit: {kri.threshold}</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-mono">STATUS ASSESSMENT</span>
                <span className={`h-2.5 w-2.5 rounded-full ${kri.status === "CRITICAL" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
