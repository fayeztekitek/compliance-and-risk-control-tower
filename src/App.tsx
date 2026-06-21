/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import VegGovernanceWorkspace from "./components/VegGovernanceWorkspace";
import SecurityGovernanceWorkspace from "./components/SecurityGovernanceWorkspace";
import RoadmapProjectWorkspace from "./components/RoadmapProjectWorkspace";
import SaaSGovernanceWorkspace from "./components/SaaSGovernanceWorkspace";
import AuditsContractsWorkspace from "./components/AuditsContractsWorkspace";
import CommitteesWorkspace from "./components/CommitteesWorkspace";
import AdministrationWorkspace from "./components/AdministrationWorkspace";
import NexusWorkspace from "./components/NexusWorkspace";

import { getCurrentRole, store } from "./store/complianceStore";

export default function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  // Force re-renders across all widgets when role/persona changes in sidebar
  const [personaTick, setPersonaTick] = useState(0);

  const activeRole = getCurrentRole();

  // Validate permission for the current view, fallback to dashboard if not allowed
  const validatePermission = (viewId: string) => {
    switch (viewId) {
      case "veg":
        return ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "security":
        return ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "nexus":
        return ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "roadmaps":
        return ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "saas":
        return ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "audits":
        return ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "committees":
        return ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"].includes(activeRole);
      case "admin":
        return ["ADMIN", "COMPLIANCE_OFFICER"].includes(activeRole);
      default:
        return true; // Dashboard is always open
    }
  };

  const handleSetView = (view: string) => {
    if (validatePermission(view)) {
      setCurrentView(view);
    } else {
      setCurrentView("dashboard");
    }
  };

  // Safe view selection
  const safeView = validatePermission(currentView) ? currentView : "dashboard";

  const handlePersonaChanged = () => {
    setPersonaTick((p) => p + 1);
    // If user's new persona has no access to current view, safety reset to dashboard
    if (!validatePermission(currentView)) {
      setCurrentView("dashboard");
    }
  };

  const handleCacheReset = () => {
    setPersonaTick((p) => p + 1);
    setCurrentView("dashboard");
  };

  return (
    <div key={personaTick} className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left Navigation Rails & Persona Portal */}
      <Sidebar
        currentView={safeView}
        onSetView={handleSetView}
        onPersonaChanged={handlePersonaChanged}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Header Controls bar */}
        <Header onPersonaChanged={handleCacheReset} onSetView={handleSetView} />

        {/* Workspace Canvas scroll area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full pb-12">
            {safeView === "dashboard" && <ExecutiveDashboard />}
            {safeView === "veg" && <VegGovernanceWorkspace />}
            {safeView === "security" && <SecurityGovernanceWorkspace />}
            {safeView === "nexus" && <NexusWorkspace />}
            {safeView === "roadmaps" && <RoadmapProjectWorkspace />}
            {safeView === "saas" && <SaaSGovernanceWorkspace />}
            {safeView === "audits" && <AuditsContractsWorkspace />}
            {safeView === "committees" && <CommitteesWorkspace />}
            {safeView === "admin" && (
              <AdministrationWorkspace onCacheReset={handleCacheReset} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
