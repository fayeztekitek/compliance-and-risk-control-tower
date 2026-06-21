/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sliders,
  CheckCircle,
  Database,
  Search,
  Users,
  AlertTriangle,
  RotateCcw,
  Clock,
  Lock,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  resetToDefaults,
  addAuditTrail,
  getAuditTrails,
} from "../store/complianceStore";

interface AdminRoleAssignerProps {
  onCacheReset: () => void;
}

export default function AdministrationWorkspace({ onCacheReset }: AdminRoleAssignerProps) {
  const role = getCurrentRole();
  const rawTrails = getAuditTrails();
  const rawUsers = store.getUsers();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState<string>("ALL");

  const [showNotification, setShowNotification] = useState(false);

  // Filter Trails
  const filteredTrails = rawTrails.filter((t) => {
    const matchesQuery =
      t.detailCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = filterModule === "ALL" || t.module === filterModule;

    return matchesQuery && matchesModule;
  });

  const handleCacheResetTrigger = () => {
    resetToDefaults();
    onCacheReset();
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);

    addAuditTrail(
      "CACHE_RESET",
      "SYSTEM",
      "Successfully restored model schema storage to initial baseline master data mock states."
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono flex items-center">
            <Sliders className="w-5 h-5 mr-2 text-indigo-600" />
            Control Panel & Compliance Auditing
          </h2>
          <p className="text-xs text-slate-505 mt-0.5">
            Administer global compliance thresholds, consult system-wide action audit trails, and manage security parameters.
          </p>
        </div>
      </div>

      {showNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Success: LocalStorage cache reset. Master-dossier schemas successfully restored to baseline states.</span>
        </div>
      )}

      {/* Grid containing admin metrics and cache controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Config Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center">
            <Lock className="w-4 h-4 mr-1 text-indigo-505" />
            Global Compliance Thresholds
          </h3>
          <div className="space-y-3.5 text-xs text-slate-600">
            <div>
              <label className="block text-slate-450 font-mono text-[9.5px] font-bold">CRITICAL DEFICIENCY REMEDIATION SLA</label>
              <p className="font-semibold text-slate-705 mt-0.5 mt-1 text-xs">SLA Window: 15 Working Days max (Strict directive)</p>
            </div>
            <div>
              <label className="block text-slate-450 font-mono text-[9.5px] font-bold">HIGH SEVERITY SLA DUE DATE LIMIT</label>
              <p className="font-semibold text-slate-705 mt-1 text-xs">SLA Window: 30 Working Days</p>
            </div>
            <div>
              <label className="block text-slate-450 font-mono text-[9.5px] font-bold">MINIMUM CHRONOS TESTING ENFORCE TARGET</label>
              <p className="font-semibold text-slate-705 mt-1 text-xs">Mandated Standard: Minimum 70% automated test coverage threshold</p>
            </div>
            <div>
              <label className="block text-slate-450 font-mono text-[9.5px] font-bold">SOVEREIGN ENCRYPTION POLICY</label>
              <p className="font-semibold text-slate-751 mt-1 text-xs text-indigo-700 bg-indigo-50 p-2 rounded">Policy Target: SHA-256 for all PII transit segments</p>
            </div>
          </div>
        </div>

        {/* User Identity matrix card */}
        <div className="bg-white border border-slate-201 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center">
            <Users className="w-4 h-4 mr-1 text-indigo-505" />
            Workspace Active Personas
          </h3>
          <div className="space-y-2.5 max-h-52 overflow-y-auto">
            {rawUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 hover:border-indigo-400 transition-all text-xs">
                <div>
                  <strong className="text-slate-705">{u.name}</strong>
                  <p className="text-[10px] text-slate-405 font-mono">{u.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold text-[9px] uppercase">
                  {u.role.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Restore control simulation card */}
        <div className="bg-white border border-slate-201 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest pb-2 border-b border-slate-101 flex items-center">
              <Database className="w-4 h-4 mr-1 text-indigo-505" />
              Sandbox Simulation Control
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed mt-2 text-justify">
              Reset cached system properties to initial master states at any time to clear custom manipulations in compliance logs.
            </p>
          </div>
          <button
            onClick={handleCacheResetTrigger}
            className="w-full py-2.5 bg-indigo-600 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-mono tracking-wider shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer mt-4"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET MODEL SCHEMAS</span>
          </button>
        </div>
      </div>

      {/* Audit Trails log table section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider font-mono">
              System Transaction Audit Trails
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Automated secure logging of transactions, parameter mutations, and compliance clearances.</p>
          </div>
          <div className="flex space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-202 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
              />
            </div>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-white border border-slate-202 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-650 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="VEG">VEG DEALS</option>
              <option value="SECURITY">SECURITY</option>
              <option value="DELIVERY">DELIVERY</option>
              <option value="SAAS_PRIVACY">SaaS & PRIVACY</option>
              <option value="AUDITS">AUDITS / CAPA</option>
              <option value="COMMITTEES">COMMITTEES</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-3">Reference ID</th>
                <th className="p-3">User Token</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Module Segment</th>
                <th className="p-3">Detailed Log Description</th>
                <th className="p-3 text-right">Server Timestamp UTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTrails.slice(0, 100).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-450 text-[10.5px]">{t.id}</td>
                  <td className="p-3 font-mono text-[11px] text-indigo-600">{t.user}</td>
                  <td className="p-3">
                    <span className="font-mono text-[10.5px] font-bold text-slate-700 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {t.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-655 font-semibold text-[11px] font-mono">{t.module}</td>
                  <td className="p-3 text-slate-755 leading-relaxed">{t.detailCode}</td>
                  <td className="p-3 text-right font-mono text-[11.5px] text-slate-505">{t.timestamp}</td>
                </tr>
              ))}
              {filteredTrails.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold font-mono">
                    No matching transaction audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
