import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import Sidebar from "./components/layout/Sidebar";
import LoginPage from "./pages/LoginPage";
import VegGovernanceWorkspace from "./pages/VegGovernanceWorkspace";
import SecurityGovernanceWorkspace from "./pages/SecurityGovernanceWorkspace";

export default function App() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const [currentView, setCurrentView] = useState("dashboard");

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
            <Sidebar currentView={currentView} onSetView={setCurrentView} />
            <div className="flex-1 flex flex-col h-screen min-w-0">
              <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
                <div className="max-w-7xl mx-auto w-full pb-12">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    {currentView === "dashboard" && "Executive Dashboard"}
                    {currentView === "veg" && <VegGovernanceWorkspace />}
                    {currentView === "security" && <SecurityGovernanceWorkspace />}
                    {currentView === "nexus" && "Nexus IQ Connector"}
                    {currentView === "roadmaps" && "Roadmaps & Projects"}
                    {currentView === "saas" && "SaaS Governance"}
                    {currentView === "audits" && "Audits & Contracts"}
                    {currentView === "committees" && "Committees"}
                    {currentView === "admin" && "Administration"}
                  </h2>
                  {currentView !== "veg" && currentView !== "security" && (
                    <p className="text-slate-500">
                      Workspace content will be implemented in subsequent sprints.
                    </p>
                  )}
                </div>
              </main>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
