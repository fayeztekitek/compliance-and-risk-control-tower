/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Milestone,
  CloudLightning,
  FileSpreadsheet,
  Gavel,
  ShieldAlert,
  Sliders,
  Users,
} from "lucide-react";
import {
  getCurrentUser,
  getCurrentRole,
  switchPersona,
  store,
} from "../store/complianceStore";
import { UserRole } from "../types";

interface SidebarProps {
  currentView: string;
  onSetView: (v: string) => void;
  onPersonaChanged: () => void;
}

export default function Sidebar({ currentView, onSetView, onPersonaChanged }: SidebarProps) {
  const activeUser = getCurrentUser();
  const activeRole = getCurrentRole();
  const users = store.getUsers();

  const handlePersonaSwitch = (userId: string) => {
    switchPersona(userId);
    onPersonaChanged();
  };

  // RBAC Permission Grid defining menu items access
  const navItems = [
    {
      id: "dashboard",
      label: "Executive Dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
      badge: null,
    },
    {
      id: "veg",
      label: "VEG & Deal Governance",
      icon: Zap,
      roles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"],
      badge: () => {
        const c = store.getVEGRequests().filter((r) => r.status === "SUBMITTED").length;
        return c > 0 ? c : null;
      },
    },
    {
      id: "security",
      label: "Security & Vulns",
      icon: ShieldAlert,
      roles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
      badge: () => {
        const c = store.getVulnerabilities().filter((v) => v.status === "OPEN" && v.severity === "CRITICAL").length;
        return c > 0 ? c : null;
      },
    },
    {
      id: "nexus",
      label: "Nexus IQ Connector",
      icon: ShieldCheck,
      roles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
      badge: null,
    },
    {
      id: "roadmaps",
      label: "Roadmaps & Projects",
      icon: Milestone,
      roles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"],
      badge: () => {
        const c = store.getProjects().filter((p) => p.status === "HIGH_RISK").length;
        return c > 0 ? c : null;
      },
    },
    {
      id: "saas",
      label: "SaaS & Privacy",
      icon: CloudLightning,
      roles: ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"],
      badge: () => {
        const c = store.getSaaSApplications().filter((s) => s.lifecycleStage === "ONBOARDING").length;
        return c > 0 ? c : null;
      },
    },
    {
      id: "audits",
      label: "Audits & Obligations",
      icon: FileSpreadsheet,
      roles: ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"],
      badge: () => {
        const c = store.getCorrectiveActions().filter((a) => a.status === "OVERDUE").length;
        return c > 0 ? c : null;
      },
    },
    {
      id: "committees",
      label: "Committees & Assembly",
      icon: Gavel,
      roles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"],
      badge: () => {
        const c = store.getCommittees().filter((t) => t.status === "PLANNED").length;
        return c > 0 ? c : null;
      },
    },
    {
      id: "admin",
      label: "Control Panel & Audit",
      icon: Sliders,
      roles: ["ADMIN", "COMPLIANCE_OFFICER"],
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3 bg-slate-950">
        <div className="p-2 bg-indigo-600 rounded-lg text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/10">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-white text-sm font-bold tracking-tight uppercase">VERMEG RiskTower</h1>
          <p className="text-[10px] text-slate-500 font-mono">COMPLIANCE ENGINE • V2.4</p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(activeRole);
          const Icon = item.icon;
          const badgeCount = item.badge ? item.badge() : null;

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => onSetView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                currentView === item.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${currentView === item.id ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {badgeCount !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                  currentView === item.id ? "bg-indigo-700 text-indigo-100" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Switcher Console */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            RBAC SWITCHER PORTAL
          </span>
        </div>
        <div className="relative">
          <select
            value={activeUser.id}
            onChange={(e) => handlePersonaSwitch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 select-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.replace(/_/g, " ")})
              </option>
            ))}
          </select>
        </div>
        <p className="text-[9px] text-slate-600 mt-2 leading-tight">
          Cycle roles to test dynamic visibility rules and action permissions on-the-fly.
        </p>
      </div>
    </aside>
  );
}
