import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import Sidebar from "./components/layout/Sidebar";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ToastContainer from "./components/ui/Toast";
import { SkeletonPage } from "./components/ui/Skeleton";

const VegGovernanceWorkspace = lazy(() => import("./pages/VegGovernanceWorkspace"));
const SecurityGovernanceWorkspace = lazy(() => import("./pages/SecurityGovernanceWorkspace"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const RoadmapWorkspace = lazy(() => import("./pages/RoadmapWorkspace"));
const SaaSGovernanceWorkspace = lazy(() => import("./pages/SaaSGovernanceWorkspace"));
const AuditWorkspace = lazy(() => import("./pages/AuditWorkspace"));
const CommitteeWorkspace = lazy(() => import("./pages/CommitteeWorkspace"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));
const NexusOverview = lazy(() => import("./pages/NexusOverview"));
const PolicyRuleWorkspace = lazy(() => import("./pages/PolicyRuleWorkspace"));
const ComplianceWorkspace = lazy(() => import("./pages/ComplianceWorkspace"));

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
                    <Suspense fallback={<SkeletonPage />}>
                      {currentView === "dashboard" && (
                        <ErrorBoundary>
                          <ExecutiveDashboard />
                        </ErrorBoundary>
                      )}
                      {(currentView === "veg" || currentView === "veg-workflow") && (
                        <ErrorBoundary>
                          <VegGovernanceWorkspace initialTab={currentView === "veg-workflow" ? "workflow" : "deals"} />
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
                      {currentView === "policy-rules" && (
                        <ErrorBoundary>
                          <PolicyRuleWorkspace />
                        </ErrorBoundary>
                      )}
                      {currentView === "compliance" && (
                        <ErrorBoundary>
                          <ComplianceWorkspace />
                        </ErrorBoundary>
                      )}
                    </Suspense>
                    {currentView !== "dashboard" && currentView !== "veg" && currentView !== "security" && currentView !== "nexus" && currentView !== "roadmaps" && currentView !== "saas" && currentView !== "audits" && currentView !== "committees" && currentView !== "admin" && currentView !== "policy-rules" && currentView !== "compliance" && (
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
