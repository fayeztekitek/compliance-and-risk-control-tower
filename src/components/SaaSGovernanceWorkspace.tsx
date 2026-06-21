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
  Cloud,
  Check,
  ShieldAlert,
  Database,
  Lock,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  addAuditTrail,
} from "../store/complianceStore";
import { SaaSApplication } from "../types";

export default function SaaSGovernanceWorkspace() {
  const role = getCurrentRole();
  const rawApps = store.getSaaSApplications();

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string>("ALL");

  const [activeTab, setActiveTab] = useState<"SAAS_REGISTRY" | "DATA_INVENTORY" | "GDPR_CHECKLIST">("SAAS_REGISTRY");

  // Selection
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    rawApps.length > 0 ? rawApps[0].id : null
  );

  // Simulated checklist state for active app
  // Every ticked check is worth 20 points of readiness score
  const [checks, setChecks] = useState({
    privacyByDesign: true,
    dpoAuthorised: true,
    gdprCompliant: false,
    steeringPassed: false,
    disasterPrepReady: false,
  });

  const filteredApps = rawApps.filter((app) => {
    const matchesQuery =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = filterStage === "ALL" || app.lifecycleStage === filterStage;
    return matchesQuery && matchesStage;
  });

  const selectedApp = rawApps.find((a) => a.id === selectedAppId);

  // Sync checklist state when app changes
  React.useEffect(() => {
    if (selectedApp) {
      setChecks({
        privacyByDesign: selectedApp.privacyDesignStatus === "COMPLIANT",
        dpoAuthorised: selectedApp.goLiveReadinessScore > 50,
        gdprCompliant: selectedApp.goLiveReadinessScore > 75,
        steeringPassed: selectedApp.steeringCheckPassed,
        disasterPrepReady: selectedApp.goLiveReadinessScore > 80,
      });
    }
  }, [selectedAppId]);

  const handleUpdateCheck = (key: keyof typeof checks) => {
    if (!selectedApp) return;

    const updatedChecks = { ...checks, [key]: !checks[key] };
    setChecks(updatedChecks);

    // Calculate dynamic scoring based on active checklist ticks
    let score = 0;
    if (updatedChecks.privacyByDesign) score += 20;
    if (updatedChecks.dpoAuthorised) score += 20;
    if (updatedChecks.gdprCompliant) score += 20;
    if (updatedChecks.steeringPassed) score += 20;
    if (updatedChecks.disasterPrepReady) score += 20;

    const privacyStatus = updatedChecks.privacyByDesign
      ? "COMPLIANT"
      : updatedChecks.gdprCompliant
      ? "PENDING"
      : "NON_COMPLIANT";

    const updatedApp: SaaSApplication = {
      ...selectedApp,
      goLiveReadinessScore: score,
      privacyDesignStatus: privacyStatus as any,
      steeringCheckPassed: updatedChecks.steeringPassed,
    };

    store.saveSaaSApplication(updatedApp);

    addAuditTrail(
      "SAAS_GO_LIVE_READINESS_MUTATED",
      "SAAS_PRIVACY",
      `SaaS App ${selectedApp.name} criteria updated. Score is now ${score}%`
    );
  };

  const isComplianceOfficerOrSec = ["ADMIN", "COMPLIANCE_OFFICER", "SECURITY_MANAGER"].includes(role);

  // Static processing inventories
  const PII_INVENTORY = [
    { id: "pii-1", dataName: "Standard Client Profiles (Brokerage Portal)", purpose: "Enforcing user authentication and audit tracing", storageLocation: "EU Central (Azure Frankfurt Hub)", retentionPeriod: "5 Years post contract exit", encryptionStandard: "AES-256 System Managed" },
    { id: "pii-2", dataName: "Active Banking IBAN & Account Feeds", purpose: "Automated direct debit settlement of pension assets", storageLocation: "Sovereign Private Cloud (Vermeg France)", retentionPeriod: "3 Years (Regulatory mandatory limit)", encryptionStandard: "AES-256 Customer KMS Key" },
    { id: "pii-3", dataName: "Client IP Connectivity & Session Cookies", purpose: "Brute-force protection and geo-blocking security auditing", storageLocation: "Staging sandbox volumes (AWS Ireland)", retentionPeriod: "180 Days", encryptionStandard: "TLS 1.3 Flight In-Transit encryption" },
    { id: "pii-4", dataName: "Legal NDAs & Background Clearance Sheets", purpose: "Validating subcontracting clearance for sensitive systems", storageLocation: "Isolated secure Azure bucket", retentionPeriod: "Employment tenure + 10 years", encryptionStandard: "AES-256 Client Managed Key" }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono">
            SaaS Lifecycle & Privacy-by-Design Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SaaS lifecycles from onboarding to offboarding, GDPR PII inventories, and compliance checks.
          </p>
        </div>
      </div>

      {/* Navigation and Segment tabs */}
      <div className="flex space-x-2 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("SAAS_REGISTRY")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "SAAS_REGISTRY" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          SaaS Lifecycle Registry ({rawApps.length})
        </button>
        <button
          onClick={() => setActiveTab("DATA_INVENTORY")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "DATA_INVENTORY" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          GDPR Personal Data Inventory
        </button>
        <button
          onClick={() => setActiveTab("GDPR_CHECKLIST")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "GDPR_CHECKLIST" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Privacy by Design Checklist Guidelines
        </button>
      </div>

      {activeTab === "SAAS_REGISTRY" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SaaS table registry list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm lg:col-span-8 flex flex-col justify-start">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SaaS software name, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-705 font-semibold focus:outline-none focus:border-indigo-505"
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-650 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Lifecycle Stages</option>
                  <option value="ONBOARDING">ONBOARDING</option>
                  <option value="GO_LIVE">GO LIVE</option>
                  <option value="OFFBOARDING">OFFBOARDING</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-505 uppercase tracking-widest">
                  <tr>
                    <th className="p-3.5">ID / Name</th>
                    <th className="p-3.5 text-center">Lifecycle Stage</th>
                    <th className="p-3.5 text-center">Readiness Score</th>
                    <th className="p-3.5">Privacy Design Status</th>
                    <th className="p-3.5">PII Category</th>
                    <th className="p-3.5 text-center">Steer Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-all ${
                        selectedAppId === app.id ? "bg-indigo-50/40 font-bold" : ""
                      }`}
                    >
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold font-mono text-slate-400 block">{app.id}</span>
                        <strong className="text-slate-700 block mt-0.5 truncate max-w-[150px]">{app.name}</strong>
                        <span className="text-[10px] text-slate-400 block mt-1 font-semibold">Owner: {app.owner}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          app.lifecycleStage === "GO_LIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.lifecycleStage === "OFFBOARDING"
                            ? "bg-slate-150 text-slate-700"
                            : "bg-amber-100 text-amber-805"
                        }`}>
                          {app.lifecycleStage.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-700">
                        <div className="flex items-center justify-center space-x-1.5">
                          <span className="font-extrabold">{app.goLiveReadinessScore}%</span>
                          <span className={`h-2 w-2 rounded-full ${
                            app.goLiveReadinessScore >= 80 ? "bg-emerald-500" : app.goLiveReadinessScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}></span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          app.privacyDesignStatus === "COMPLIANT"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : app.privacyDesignStatus === "PENDING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-250 font-bold"
                        }`}>
                          {app.privacyDesignStatus}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          app.dataCategory === "PII_SENSITIVE" ? "bg-rose-50 text-rose-700" : app.dataCategory === "PII_COMMON" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"
                        }`}>
                          {app.dataCategory.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {app.steeringCheckPassed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Readiness Checklist checklist panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-4 flex flex-col justify-between">
            {selectedApp ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400">READINESS & AUDIT PANEL • {selectedApp.id}</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">{selectedApp.name}</h3>
                </div>

                {/* Score circular indicators */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">GO-LIVE COMPLIANCE WEIGHT</span>
                    <strong className="text-2xl font-mono text-slate-800 tracking-tight mt-1 inline-block">{selectedApp.goLiveReadinessScore}% Validated</strong>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                    selectedApp.goLiveReadinessScore >= 80 ? "bg-emerald-100 text-emerald-800" : selectedApp.goLiveReadinessScore >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-105 text-rose-800"
                  }`}>
                    {selectedApp.goLiveReadinessScore >= 80 ? "PASS" : "BLOCK"}
                  </div>
                </div>

                {/* Dynamic Checklist checks */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Go-Live Governance Criteria
                  </p>

                  <div className="space-y-2.5">
                    {/* Privacy check */}
                    <div
                      onClick={() => isComplianceOfficerOrSec && handleUpdateCheck("privacyByDesign")}
                      className={`flex items-start justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        checks.privacyByDesign ? "bg-slate-50 border-emerald-400" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${checks.privacyByDesign ? "bg-emerald-500 border-transparent text-white" : "border-slate-300 bg-white"}`}>
                          {checks.privacyByDesign && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-755 leading-none">Privacy by Design Check</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Sanitized APIs & minimum privilege data bounds</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-slate-400">Wt. 20%</span>
                    </div>

                    {/* DPO check */}
                    <div
                      onClick={() => isComplianceOfficerOrSec && handleUpdateCheck("dpoAuthorised")}
                      className={`flex items-start justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        checks.dpoAuthorised ? "bg-slate-50 border-emerald-400" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${checks.dpoAuthorised ? "bg-emerald-500 border-transparent text-white" : "border-slate-300 bg-white"}`}>
                          {checks.dpoAuthorised && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-755 leading-none">DPO Authority Review</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Formal sign-off of the processing directory records</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-slate-400">Wt. 20%</span>
                    </div>

                    {/* GDPR Compliant */}
                    <div
                      onClick={() => isComplianceOfficerOrSec && handleUpdateCheck("gdprCompliant")}
                      className={`flex items-start justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        checks.gdprCompliant ? "bg-slate-50 border-emerald-400" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${checks.gdprCompliant ? "bg-emerald-500 border-transparent text-white" : "border-slate-300 bg-white"}`}>
                          {checks.gdprCompliant && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-755 leading-none">GDPR Compliance Verification</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Consent prompts & access delete mechanisms active</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-slate-400">Wt. 20%</span>
                    </div>

                    {/* Steering Passed */}
                    <div
                      onClick={() => isComplianceOfficerOrSec && handleUpdateCheck("steeringPassed")}
                      className={`flex items-start justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        checks.steeringPassed ? "bg-slate-50 border-emerald-400" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${checks.steeringPassed ? "bg-emerald-500 border-transparent text-white" : "border-slate-300 bg-white"}`}>
                          {checks.steeringPassed && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-755 leading-none">SaaS Steer Committee Clearance</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Formal clearance inside agenda templates</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-slate-400">Wt. 20%</span>
                    </div>

                    {/* Disaster Prep */}
                    <div
                      onClick={() => isComplianceOfficerOrSec && handleUpdateCheck("disasterPrepReady")}
                      className={`flex items-start justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        checks.disasterPrepReady ? "bg-slate-50 border-emerald-400" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${checks.disasterPrepReady ? "bg-emerald-500 border-transparent text-white" : "border-slate-300 bg-white"}`}>
                          {checks.disasterPrepReady && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-755 leading-none">DRP / RPO / RTO Readiness Test</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Uptime failover limits checked & simulated</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-slate-400">Wt. 20%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-mono text-xs">
                Select a SaaS application platform from the registry.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "DATA_INVENTORY" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Sovereign GDPR PII Processing & Retention Inventory
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Documented registry mapping category targets, purposes of legal processing, retention schedules, and encryption algorithms.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Intended Lawful Processing Purpose</th>
                  <th className="p-3.5 font-mono">Storage Point</th>
                  <th className="p-3.5">Retention Protocol</th>
                  <th className="p-3.5 font-mono">Disk / Flight Encryption Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-sans">
                {PII_INVENTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <strong className="text-slate-850 block">{item.dataName}</strong>
                      <span className="text-[9px] text-indigo-600 font-bold font-mono uppercase mt-0.5 inline-block">{item.id}</span>
                    </td>
                    <td className="p-3.5 text-slate-700 leading-snug">{item.purpose}</td>
                    <td className="p-3.5 text-slate-750 font-mono text-[11px] font-semibold">{item.storageLocation}</td>
                    <td className="p-3.5 text-slate-650 font-mono text-[11px]">{item.retentionPeriod}</td>
                    <td className="p-3.5 text-indigo-700 font-mono font-bold text-[11px]">{item.encryptionStandard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "GDPR_CHECKLIST" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
            Privacy by Design & GDPR Audit Guidelines
          </h3>
          <p className="text-xs text-slate-450">Executive baseline criteria required for all internal Palmyra software development pipelines:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-705 font-mono flex items-center">
                <Database className="w-4 h-4 mr-2 text-indigo-605" />
                Privacy by Default Standard (Minimization)
              </h4>
              <ul className="space-y-2 text-slate-650 list-disc list-inside leading-relaxed">
                <li>No credentials, access codes, or PII can be recorded in unmasked debug logs.</li>
                <li>Production database clones must undergo automated tokenization or scrambling before loading in developer environments.</li>
                <li>Network communication channels must restrict broad endpoint scopes via strict API Gateways.</li>
                <li>Database disks must implement continuous AES-255 encryption at rest.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-705 font-mono flex items-center">
                <Lock className="w-4 h-4 mr-2 text-indigo-605" />
                Data Protection Officer Clearance
              </h4>
              <ul className="space-y-2 text-slate-650 list-disc list-inside leading-relaxed">
                <li>Third party SaaS tools must supplyCREST authentication certificates or complete compliance questionnaires.</li>
                <li>DPA (Data Processing Appendix) documents require formal routing and signatures from executive legal officers.</li>
                <li>Bi-annual backup simulation checks are mandatory to audit uptime recovery limits.</li>
                <li>Developer accounts assigned to sensitive workspaces require quarterly MFA group sweeps.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
