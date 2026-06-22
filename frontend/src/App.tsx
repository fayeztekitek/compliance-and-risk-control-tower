import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import Sidebar from "./components/layout/Sidebar";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import VegGovernanceWorkspace from "./pages/VegGovernanceWorkspace";
import SecurityGovernanceWorkspace from "./pages/SecurityGovernanceWorkspace";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import RoadmapWorkspace from "./pages/RoadmapWorkspace";
import SaaSGovernanceWorkspace from "./pages/SaaSGovernanceWorkspace";
import AuditWorkspace from "./pages/AuditWorkspace";
import CommitteeWorkspace from "./pages/CommitteeWorkspace";
import AdminWorkspace from "./pages/AdminWorkspace";
import NexusOverview from "./pages/NexusOverview";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ToastContainer from "./components/ui/Toast";

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
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route
          path="/*"
          element={
            <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
              <Sidebar currentView={currentView} onSetView={setCurrentView} />
              <div className="flex-1 flex flex-col h-screen min-w-0">
                <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
                  <div className="max-w-7xl mx-auto w-full pb-12">
                    {currentView === "dashboard" && (
                      <ErrorBoundary>
                        <ExecutiveDashboard />
                      </ErrorBoundary>
                    )}
                    {currentView === "veg" && (
                      <ErrorBoundary>
                        <VegGovernanceWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "security" && (
                      <ErrorBoundary>
                        <SecurityGovernanceWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "roadmaps" && (
                      <ErrorBoundary>
                        <RoadmapWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "saas" && (
                      <ErrorBoundary>
                        <SaaSGovernanceWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "audits" && (
                      <ErrorBoundary>
                        <AuditWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "committees" && (
                      <ErrorBoundary>
                        <CommitteeWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "admin" && (
                      <ErrorBoundary>
                        <AdminWorkspace />
                      </ErrorBoundary>
                    )}
                    {currentView === "nexus" && (
                      <ErrorBoundary>
                        <NexusOverview />
                      </ErrorBoundary>
                    )}
                    {currentView !== "dashboard" && currentView !== "veg" && currentView !== "security" && currentView !== "nexus" && currentView !== "roadmaps" && currentView !== "saas" && currentView !== "audits" && currentView !== "committees" && currentView !== "admin" && (
                      <div className="text-center py-16 text-slate-500">
                        <p className="text-lg font-medium">Workspace not found</p>
                        <p className="text-sm mt-1">The requested view does not exist.</p>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            </div>
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
}
