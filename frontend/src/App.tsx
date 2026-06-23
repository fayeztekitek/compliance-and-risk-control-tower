import { lazy, Suspense } from "react";
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
const NexusAppDetail = lazy(() => import("./pages/NexusApplicationDetail"));
const NexusReportDetail = lazy(() => import("./pages/NexusReportDetail"));
const NexusVulnerabilityDetail = lazy(() => import("./pages/NexusVulnerabilityDetail"));
const NexusOccurrenceDetail = lazy(() => import("./pages/NexusOccurrenceDetail"));
const PolicyRuleWorkspace = lazy(() => import("./pages/PolicyRuleWorkspace"));
const ComplianceWorkspace = lazy(() => import("./pages/ComplianceWorkspace"));

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full pb-12">
            <Suspense fallback={<SkeletonPage />}>
              <ErrorBoundary>{children}</ErrorBoundary>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();

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
        <Route path="/404" element={<AuthLayout><NotFoundPage /></AuthLayout>} />
        <Route path="/dashboard" element={<AuthLayout><ExecutiveDashboard /></AuthLayout>} />
        <Route path="/security" element={<AuthLayout><SecurityGovernanceWorkspace /></AuthLayout>} />
        <Route path="/roadmaps" element={<AuthLayout><RoadmapWorkspace /></AuthLayout>} />
        <Route path="/saas" element={<AuthLayout><SaaSGovernanceWorkspace /></AuthLayout>} />
        <Route path="/audits" element={<AuthLayout><AuditWorkspace /></AuthLayout>} />
        <Route path="/committees" element={<AuthLayout><CommitteeWorkspace /></AuthLayout>} />
        <Route path="/admin" element={<AuthLayout><AdminWorkspace /></AuthLayout>} />
        <Route path="/policy-rules" element={<AuthLayout><PolicyRuleWorkspace /></AuthLayout>} />
        <Route path="/compliance" element={<AuthLayout><ComplianceWorkspace /></AuthLayout>} />
        <Route path="/veg" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/list" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/deal/:dealId" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/workflow" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/nexus" element={<AuthLayout><NexusOverview /></AuthLayout>} />
        <Route path="/nexus/app/:appId" element={<AuthLayout><NexusAppDetail /></AuthLayout>} />
        <Route path="/nexus/report/:reportId" element={<AuthLayout><NexusReportDetail /></AuthLayout>} />
        <Route path="/nexus/vuln/:vulnId" element={<AuthLayout><NexusVulnerabilityDetail /></AuthLayout>} />
        <Route path="/nexus/occurrence/:occId" element={<AuthLayout><NexusOccurrenceDetail /></AuthLayout>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<AuthLayout><NotFoundPage /></AuthLayout>} />
      </Routes>
      <ToastContainer />
    </>
  );
}
