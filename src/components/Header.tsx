/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  Briefcase,
  Shield,
  Scale,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  getCurrentUser,
  getCurrentRole,
  getNotifications,
  markAsRead,
  resetToDefaults,
  calculateKPIs,
  store,
} from "../store/complianceStore";

interface HeaderProps {
  onPersonaChanged: () => void;
  onSetView?: (viewId: string) => void;
}

export default function Header({ onPersonaChanged, onSetView }: HeaderProps) {
  const user = getCurrentUser();
  const role = getCurrentRole();
  const notifications = getNotifications().filter((n) => !n.read);
  const kpis = calculateKPIs();

  const [notifOpen, setNotifOpen] = useState(false);

  // Search local states
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownFocused, setIsDropdownFocused] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<{
    type: "PROJECT" | "VULNERABILITY" | "CONTRACT";
    data: any;
  } | null>(null);

  // Click outside search container detector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate high-level compliance index (Average score of compliance metrics)
  const dCompl = kpis.find((k) => k.id === "kpi-dossier-completeness")?.value ?? 80;
  const pCompl = kpis.find((k) => k.id === "kpi-privacy-compliance")?.value ?? 80;
  const oCompl = kpis.find((k) => k.id === "kpi-obligations-compliance")?.value ?? 85;
  const complianceIndex = Math.round((dCompl + pCompl + oCompl) / 3);

  const handleRead = (id: string) => {
    markAsRead(id);
    onPersonaChanged();
  };

  // Search lookup computation
  const query = searchQuery.trim().toLowerCase();
  
  const rawProjects = store.getProjects();
  const rawVulnerabilities = store.getVulnerabilities();
  const rawContracts = store.getContractualObligations();

  const matchingProjects = query.length >= 2 ? rawProjects.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.code.toLowerCase().includes(query) ||
    p.manager.toLowerCase().includes(query) ||
    p.id.toLowerCase().includes(query)
  ) : [];

  const matchingVulnerabilities = query.length >= 2 ? rawVulnerabilities.filter(v => 
    v.title.toLowerCase().includes(query) ||
    v.id.toLowerCase().includes(query) ||
    v.severity.toLowerCase().includes(query) ||
    v.targetProduct.toLowerCase().includes(query) ||
    v.owner.toLowerCase().includes(query)
  ) : [];

  const matchingContracts = query.length >= 2 ? rawContracts.filter(c => 
    c.title.toLowerCase().includes(query) ||
    c.id.toLowerCase().includes(query) ||
    c.requirement.toLowerCase().includes(query) ||
    c.sourceContract.toLowerCase().includes(query) ||
    c.verifiedBy.toLowerCase().includes(query)
  ) : [];

  const hasAnyMatches = matchingProjects.length > 0 || matchingVulnerabilities.length > 0 || matchingContracts.length > 0;

  // Search keyword highlight generator
  const highlightText = (text: string, searchVal: string) => {
    if (!searchVal) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(searchVal)})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchVal.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Permission computation for inspected item navigate checks
  const getInspectionPermission = () => {
    if (!inspectedItem) return false;
    const destinationView =
      inspectedItem.type === "PROJECT" ? "roadmaps" :
      inspectedItem.type === "VULNERABILITY" ? "security" :
      "audits";
    const userRole = getCurrentRole();
    if (destinationView === "roadmaps") {
      return ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"].includes(userRole);
    } else if (destinationView === "security") {
      return ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"].includes(userRole);
    } else if (destinationView === "audits") {
      return ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"].includes(userRole);
    }
    return false;
  };

  const isInspectedViewAllowed = getInspectionPermission();

  return (
    <header className="h-16 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between px-6 z-20">
      {/* Search / Title Context */}
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
          System Control Tower
        </h2>
        <span className="h-4 w-[1px] bg-slate-200"></span>
        <div className="flex items-center space-x-1 p-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>FY26 RUNTIME • JUN 10, 2026 UTC</span>
        </div>

        <span className="h-4 w-[1px] bg-slate-200 hidden md:inline"></span>

        {/* Global Search Interface Container */}
        <div ref={searchRef} className="relative w-48 sm:w-64 md:w-80 transition-all duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search project, vuln, contract..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownFocused(true);
              }}
              onFocus={() => setIsDropdownFocused(true)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isDropdownFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 mt-2 w-96 md:w-[28rem] bg-white border border-slate-200 rounded-xl shadow-xl py-3 z-50 text-slate-800 max-h-[30rem] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              {searchQuery.trim().length < 2 ? (
                <div className="px-4 py-3 text-xs text-slate-400 font-mono flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-300 flex-shrink-0 animate-pulse" />
                  <span>Type at least 2 characters to audit...</span>
                </div>
              ) : !hasAnyMatches ? (
                <div className="px-4 py-6 text-center text-slate-400 text-xs">
                  <AlertTriangle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  No matching Projects, Vulnerabilities, or Contracts found.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Category: Projects */}
                  {matchingProjects.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-4 py-1 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-slate-400 tracking-wider font-mono flex items-center">
                          <Briefcase className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                          Projects ({matchingProjects.length})
                        </span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {matchingProjects.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setInspectedItem({ type: "PROJECT", data: p });
                              setIsDropdownFocused(false);
                            }}
                            className="px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[70%]">
                                {highlightText(p.name, searchQuery)}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                p.status === "ON_TRACK"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : p.status === "DEVIATING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}>
                                {p.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                              <span>Code: {highlightText(p.code, searchQuery)}</span>
                              <span>Lead: {highlightText(p.manager, searchQuery)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Vulnerabilities */}
                  {matchingVulnerabilities.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-4 py-1 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-slate-400 tracking-wider font-mono flex items-center">
                          <Shield className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                          Vulnerabilities ({matchingVulnerabilities.length})
                        </span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {matchingVulnerabilities.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setInspectedItem({ type: "VULNERABILITY", data: v });
                              setIsDropdownFocused(false);
                            }}
                            className="px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[70%]">
                                {highlightText(v.title, searchQuery)}
                              </span>
                              <div className="flex space-x-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                  v.severity === "CRITICAL"
                                    ? "bg-rose-100 text-rose-800"
                                    : v.severity === "HIGH"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-slate-100 text-slate-700"
                                }`}>
                                  {v.severity}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                  v.status === "OPEN"
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : v.status === "REMEDIATED"
                                    ? "bg-emerald-50 text-emerald-650 border border-emerald-100"
                                    : "bg-slate-100 text-slate-500"
                                }`}>
                                  {v.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                              <span>ID: {highlightText(v.id, searchQuery)}</span>
                              <span>Asset: {highlightText(v.targetProduct, searchQuery)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Contracts */}
                  {matchingContracts.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-4 py-1 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-slate-400 tracking-wider font-mono flex items-center">
                          <Scale className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                          Contract Obligations ({matchingContracts.length})
                        </span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {matchingContracts.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setInspectedItem({ type: "CONTRACT", data: c });
                              setIsDropdownFocused(false);
                            }}
                            className="px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[70%]">
                                {highlightText(c.title, searchQuery)}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                c.status === "COMPLIANT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                              <span>Contract: {highlightText(c.sourceContract, searchQuery)}</span>
                              <span>Auditor: {highlightText(c.verifiedBy, searchQuery)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Control Widgets */}
      <div className="flex items-center space-x-6">
        {/* Global Compliance Health score */}
        <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-slate-50 to-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">COMPLIANCE INDEX</p>
            <p className="text-sm font-bold text-slate-800">{complianceIndex}% SLA Match</p>
          </div>
          <div className="relative">
            <svg className="w-9 h-9 transform -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#e2e8f0"
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke={complianceIndex > 80 ? "#10b981" : complianceIndex > 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="3.5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - complianceIndex / 100)}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-slate-700">
              {complianceIndex}
            </span>
          </div>
        </div>

        {/* Database Reset */}
        <button
          onClick={resetToDefaults}
          title="Reset database data cache to default state"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center space-x-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-xs font-mono font-medium hidden lg:inline">RELOAD CACHE</span>
        </button>

        {/* System Notifications Alert bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-600 font-mono">ACTIVE ALERTS ({notifications.length})</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">ATTENTION</span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    All operational controls are compliant. No active alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start space-x-2.5"
                    >
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.type === "ALERT" ? "text-rose-500" : "text-amber-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.content}</p>
                        <button
                          onClick={() => handleRead(n.id)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium mt-1 inline-block cursor-pointer font-mono"
                        >
                          Mark as clear
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Profile context Card */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs border border-indigo-200 uppercase shadow-inner">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="text-left hidden sm:block">
            <h4 className="text-xs font-semibold text-slate-700 leading-3">{user.name}</h4>
            <span className="inline-flex items-center space-x-0.5 text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mt-1 uppercase">
              <UserCheck className="w-2.5 h-2.5" />
              <span>{role.replace(/_/g, " ")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search Result Inspector Modal */}
      {inspectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white border border-slate-205 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-800 text-left">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-650 border border-indigo-100 px-2.5 py-1 rounded inline-block">
                  {inspectedItem.type} METADATA PORTAL
                </span>
                <h3 className="text-sm font-bold text-slate-805 mt-2">
                  {inspectedItem.type === "PROJECT" ? inspectedItem.data.name :
                   inspectedItem.type === "VULNERABILITY" ? inspectedItem.data.title :
                   inspectedItem.data.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Info Panel */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3.5 text-xs text-slate-600">
              {inspectedItem.type === "PROJECT" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">PROJECT ID</span>
                      <span className="font-mono font-bold text-slate-800">{inspectedItem.data.id}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">PROJECT CODE</span>
                      <span className="font-mono font-bold text-indigo-600">{inspectedItem.data.code}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">PROJECT MANAGER</span>
                      <span className="font-semibold text-slate-705">{inspectedItem.data.manager}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">STATUS ASSESSMENT</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        inspectedItem.data.status === "ON_TRACK"
                          ? "bg-emerald-100 text-emerald-800"
                          : inspectedItem.data.status === "DEVIATING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>{inspectedItem.data.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono">RTD DEVIATION</span>
                      <span className="font-mono text-sm font-bold text-slate-700">{inspectedItem.data.rtdDeviation}%</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono">BUDGET LEVEL</span>
                      <span className="font-mono text-sm font-bold text-slate-700">{inspectedItem.data.consumedBudget} / {inspectedItem.data.initialBudget}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono">TEST COVERAGE</span>
                      <span className="font-mono text-sm font-bold text-slate-700">{inspectedItem.data.testAutomationRate}%</span>
                    </div>
                  </div>
                </>
              )}

              {inspectedItem.type === "VULNERABILITY" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">VULNERABILITY ID</span>
                      <span className="font-mono font-bold text-slate-800">{inspectedItem.data.id}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">SCANNER SOURCE</span>
                      <span className="font-mono font-bold text-slate-800">{inspectedItem.data.sourceScanner}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">TARGET PRODUCT</span>
                      <span className="font-semibold text-slate-705">{inspectedItem.data.targetProduct}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">OWNER ASSIGNEE</span>
                      <span className="font-semibold text-slate-705">{inspectedItem.data.owner}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">DETECTION DATE</span>
                      <span className="font-mono">{inspectedItem.data.detectedDate}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">SLA DUE DATE</span>
                      <span className="font-mono text-rose-600 font-bold">{inspectedItem.data.slaDueDate}</span>
                    </div>
                  </div>
                  <div className="flex space-x-4 pt-2 border-t border-slate-200 justify-start">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono mb-0.5">SEVERITY LEVEL:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        inspectedItem.data.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : inspectedItem.data.severity === "HIGH"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-700"
                      }`}>{inspectedItem.data.severity}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono mb-0.5">CURRENT STATUS:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        inspectedItem.data.status === "OPEN"
                          ? "bg-rose-100 text-rose-800"
                          : inspectedItem.data.status === "REMEDIATED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-705"
                      }`}>{inspectedItem.data.status}</span>
                    </div>
                  </div>
                </>
              )}

              {inspectedItem.type === "CONTRACT" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">OBLIGATION REFERENCE ID</span>
                      <span className="font-mono font-bold text-slate-800">{inspectedItem.data.id}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">SOURCE CONTRACT</span>
                      <span className="font-mono font-bold text-indigo-650">{inspectedItem.data.sourceContract}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold font-mono">REQUIREMENT GUIDELINES</span>
                    <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-100 mt-1 font-medium">{inspectedItem.data.requirement}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">VERIFICATION TERM</span>
                      <span className="font-semibold text-slate-705">{inspectedItem.data.frequency}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold font-mono">AUDITOR IN CHARGE</span>
                      <span className="font-semibold text-slate-755">{inspectedItem.data.verifiedBy}</span>
                    </div>
                  </div>
                  <div className="flex space-x-4 pt-2 border-t border-slate-200 justify-start">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono mb-0.5">COMPLIANCE STATUS:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        inspectedItem.data.status === "COMPLIANT"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-150"
                          : "bg-rose-100 text-rose-800 border border-rose-150"
                      }`}>{inspectedItem.data.status}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold font-mono mb-0.5">LAST VERIFIED DATE:</span>
                      <span className="font-mono font-semibold text-slate-705">{inspectedItem.data.lastVerifiedDate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10.5px] text-slate-400 italic">
                {inspectedItem.type === "PROJECT" ? "Requires Product Owner or Risk Manager." :
                 inspectedItem.type === "VULNERABILITY" ? "Requires Security Manager or auditor." :
                 "Requires Compliance Officer or auditor."}
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs cursor-pointer font-bold"
                >
                  Close
                </button>
                {onSetView && (
                  isInspectedViewAllowed ? (
                    <button
                      type="button"
                      onClick={() => {
                        const destinationView =
                          inspectedItem.type === "PROJECT" ? "roadmaps" :
                          inspectedItem.type === "VULNERABILITY" ? "security" :
                          "audits";
                        onSetView(destinationView);
                        setInspectedItem(null);
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-705 text-white rounded-lg text-xs font-extrabold cursor-pointer inline-flex items-center space-x-1 shadow-sm transition-all"
                    >
                      <span>Go to Workspace</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Role permission restriction"
                      className="px-4 py-1.5 bg-slate-100 text-slate-400 border border-slate-205 rounded-lg text-xs font-bold inline-flex items-center space-x-1 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Workspace Locked</span>
                    </button>
                  )
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
