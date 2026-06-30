import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ToastContainer from "./components/ui/Toast";
import { SkeletonPage } from "./components/ui/Skeleton";
import { usePageContextStore } from "./store/pageContext.store";
import ChatbotWidget from "./components/layout/ChatbotWidget";

const VegGovernanceWorkspace = lazy(() => import("./pages/VegGovernanceWorkspace"));
const VegComexDashboard = lazy(() => import("./pages/VegComexDashboard"));
const SecurityGovernanceWorkspace = lazy(() => import("./pages/SecurityGovernanceWorkspace"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage"));
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage"));
const VulnerabilitiesPage = lazy(() => import("./pages/VulnerabilitiesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const RiskManagementPage = lazy(() => import("./pages/RiskManagementPage"));
const WaivedAcceptedRisksPage = lazy(() => import("./pages/WaivedAcceptedRisksPage"));
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
const NexusReportComparison = lazy(() => import("./pages/NexusReportComparison"));
const NexusEvolutionTimeline = lazy(() => import("./pages/NexusEvolutionTimeline"));
const PolicyRuleWorkspace = lazy(() => import("./pages/PolicyRuleWorkspace"));
const ComplianceWorkspace = lazy(() => import("./pages/ComplianceWorkspace"));

// NEW page components
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const RiskDashboard = lazy(() => import("./pages/RiskDashboard"));
const AuditDashboard = lazy(() => import("./pages/AuditDashboard"));
const CommitteesDashboard = lazy(() => import("./pages/CommitteesDashboard"));
const SaaSDashboard = lazy(() => import("./pages/SaaSDashboard"));
const RoadmapsDashboard = lazy(() => import("./pages/RoadmapsDashboard"));
const AiHubPage = lazy(() => import("./pages/AiHubPage"));
const PromptLibraryPage = lazy(() => import("./pages/PromptLibraryPage"));
const AiAgentsPage = lazy(() => import("./pages/AiAgentsPage"));
const CopilotChatPage = lazy(() => import("./pages/CopilotChatPage"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage"));
const McpConnectorsPage = lazy(() => import("./pages/McpConnectorsPage"));
const ReportEnginePage = lazy(() => import("./pages/ReportEnginePage"));
const PipelinesPage = lazy(() => import("./pages/PipelinesPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectsDashboard = lazy(() => import("./pages/ProjectsDashboard"));
const ProjectsExecutiveDashboardPage = lazy(() => import("./pages/ProjectsExecutiveDashboardPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const SteercoPage = lazy(() => import("./pages/SteercoPage"));
const SteercoOverviewPage = lazy(() => import("./pages/SteercoOverviewPage"));
const KpiDefinitionsPage = lazy(() => import("./pages/KpiDefinitionsPage"));
const RoadmapsPage = lazy(() => import("./pages/RoadmapsPage"));
const RoadmapDetailPage = lazy(() => import("./pages/RoadmapDetailPage"));
const RoadmapExecutiveDashboardPage = lazy(() => import("./pages/RoadmapExecutiveDashboardPage"));
const SnapshotOverviewPage = lazy(() => import("./pages/SnapshotOverviewPage"));
const SnapshotDetailPage = lazy(() => import("./pages/SnapshotDetailPage"));
const SnapshotComparePage = lazy(() => import("./pages/SnapshotComparePage"));

function AuthLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const setPage = usePageContextStore(s => s.setPage);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/executive") || path === "/") setPage("executive");
    else if (path.startsWith("/compliance")) setPage("compliance");
    else if (path.startsWith("/risk")) setPage("risk");
    else if (path.startsWith("/audit")) setPage("audit");
    else if (path.startsWith("/committees")) setPage("committees");
    else if (path.startsWith("/roadmaps")) setPage("roadmaps");
    else if (path.startsWith("/projects")) setPage("projects");
    else if (path.startsWith("/saas")) setPage("saas");
    else if (path.startsWith("/veg")) setPage("veg");
    else if (path.startsWith("/finding")) setPage("finding-components");
    else if (path.startsWith("/vulnerabilities")) setPage("vulnerabilities");
    else if (path.startsWith("/ai")) setPage("ai-hub");
    else if (path.startsWith("/admin")) setPage("admin");
    else if (path.startsWith("/security")) setPage("risk");
  }, [location]);

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full pb-12">
            <Suspense fallback={<SkeletonPage />}>
              <ErrorBoundary>{children}</ErrorBoundary>
            </Suspense>
          </div>
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}

export default function App() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => { initialize(); }, [initialize]);

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

        {/* Executive */}
        <Route path="/dashboard" element={<AuthLayout><ExecutiveDashboard /></AuthLayout>} />
        <Route path="/executive/reports" element={<AuthLayout><ReportsPage /></AuthLayout>} />
        <Route path="/executive/alerts" element={<AuthLayout><ExecutiveDashboard /></AuthLayout>} />

        {/* Organizations */}
        <Route path="/organizations" element={<AuthLayout><OrganizationsPage /></AuthLayout>} />
        <Route path="/applications" element={<AuthLayout><ApplicationsPage /></AuthLayout>} />

        {/* VEG Governance */}
        <Route path="/veg" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/list" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/deal/:dealId" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/workflow" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/dashboard" element={<AuthLayout><VegComexDashboard /></AuthLayout>} />
        <Route path="/veg/decisions" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/negotiation" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/documents" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />
        <Route path="/veg/actions" element={<AuthLayout><VegGovernanceWorkspace /></AuthLayout>} />

        {/* Security */}
        <Route path="/security" element={<AuthLayout><SecurityGovernanceWorkspace /></AuthLayout>} />
        <Route path="/security/dashboard" element={<AuthLayout><SecurityDashboard /></AuthLayout>} />
        <Route path="/vulnerabilities" element={<AuthLayout><VulnerabilitiesPage /></AuthLayout>} />
        <Route path="/risk-management" element={<AuthLayout><RiskManagementPage /></AuthLayout>} />
        <Route path="/waived-accepted-risks" element={<AuthLayout><WaivedAcceptedRisksPage /></AuthLayout>} />
        <Route path="/policy-rules" element={<AuthLayout><PolicyRuleWorkspace /></AuthLayout>} />
        <Route path="/reports" element={<AuthLayout><ReportsPage /></AuthLayout>} />

        {/* Nexus IQ */}
        <Route path="/nexus" element={<AuthLayout><NexusOverview /></AuthLayout>} />
        <Route path="/nexus/app/:appId" element={<AuthLayout><NexusAppDetail /></AuthLayout>} />
        <Route path="/nexus/report/:reportId" element={<AuthLayout><NexusReportDetail /></AuthLayout>} />
        <Route path="/nexus/compare" element={<AuthLayout><NexusReportComparison /></AuthLayout>} />
        <Route path="/nexus/evolution/:appId" element={<AuthLayout><NexusEvolutionTimeline /></AuthLayout>} />
        <Route path="/nexus/vuln/:vulnId" element={<AuthLayout><NexusVulnerabilityDetail /></AuthLayout>} />
        <Route path="/nexus/occurrence/:occId" element={<AuthLayout><NexusOccurrenceDetail /></AuthLayout>} />

        {/* Roadmaps Monitoring */}
        <Route path="/roadmaps" element={<AuthLayout><RoadmapsPage /></AuthLayout>} />
        <Route path="/roadmaps/:id" element={<AuthLayout><RoadmapDetailPage /></AuthLayout>} />
        <Route path="/roadmaps/dashboard" element={<AuthLayout><RoadmapsDashboard /></AuthLayout>} />
        <Route path="/roadmaps/executive-dashboard" element={<AuthLayout><RoadmapExecutiveDashboardPage /></AuthLayout>} />

        {/* Snapshots */}
        <Route path="/snapshots" element={<AuthLayout><SnapshotOverviewPage /></AuthLayout>} />
        <Route path="/snapshots/:id" element={<AuthLayout><SnapshotDetailPage /></AuthLayout>} />
        <Route path="/snapshots/compare/:id1/:id2" element={<AuthLayout><SnapshotComparePage /></AuthLayout>} />

        {/* Projects Monitoring */}
        <Route path="/projects" element={<AuthLayout><ProjectsPage /></AuthLayout>} />
        <Route path="/projects/dashboard" element={<AuthLayout><ProjectsDashboard /></AuthLayout>} />
        <Route path="/projects/executive-dashboard" element={<AuthLayout><ProjectsExecutiveDashboardPage /></AuthLayout>} />
        <Route path="/projects/:id" element={<AuthLayout><ProjectDetailPage /></AuthLayout>} />
        <Route path="/projects/:id/steerco" element={<AuthLayout><SteercoPage /></AuthLayout>} />
        <Route path="/steerco" element={<AuthLayout><SteercoOverviewPage /></AuthLayout>} />

        {/* SaaS */}
        <Route path="/saas" element={<AuthLayout><SaaSGovernanceWorkspace /></AuthLayout>} />
        <Route path="/saas/dashboard" element={<AuthLayout><SaaSDashboard /></AuthLayout>} />

        {/* Compliance */}
        <Route path="/compliance" element={<AuthLayout><ComplianceWorkspace /></AuthLayout>} />
        <Route path="/compliance/dashboard" element={<AuthLayout><ComplianceDashboard /></AuthLayout>} />
        <Route path="/compliance/controls" element={<AuthLayout><ComplianceWorkspace /></AuthLayout>} />

        {/* Audits */}
        <Route path="/audits" element={<AuthLayout><AuditWorkspace /></AuthLayout>} />
        <Route path="/audits/dashboard" element={<AuthLayout><AuditDashboard /></AuthLayout>} />

        {/* Committees */}
        <Route path="/committees" element={<AuthLayout><CommitteeWorkspace /></AuthLayout>} />
        <Route path="/committees/dashboard" element={<AuthLayout><CommitteesDashboard /></AuthLayout>} />

        {/* Risk */}
        <Route path="/risk/dashboard" element={<AuthLayout><RiskDashboard /></AuthLayout>} />
        <Route path="/risk/register" element={<AuthLayout><RiskDashboard /></AuthLayout>} />

        {/* Administration */}
        <Route path="/admin" element={<AuthLayout><AdminWorkspace /></AuthLayout>} />

        {/* AI Assistant */}
        <Route path="/ai" element={<AuthLayout><AiHubPage /></AuthLayout>} />
        <Route path="/ai/prompts" element={<AuthLayout><PromptLibraryPage /></AuthLayout>} />
        <Route path="/ai/agents" element={<AuthLayout><AiAgentsPage /></AuthLayout>} />
        <Route path="/ai/copilot/:type" element={<AuthLayout><CopilotChatPage /></AuthLayout>} />
        <Route path="/ai/knowledge-base" element={<AuthLayout><KnowledgeBasePage /></AuthLayout>} />
        <Route path="/ai/connectors" element={<AuthLayout><McpConnectorsPage /></AuthLayout>} />
        <Route path="/reports/engine" element={<AuthLayout><ReportEnginePage /></AuthLayout>} />
        <Route path="/pipelines" element={<AuthLayout><PipelinesPage /></AuthLayout>} />
        <Route path="/kpi-definitions" element={<AuthLayout><KpiDefinitionsPage /></AuthLayout>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<AuthLayout><NotFoundPage /></AuthLayout>} />
      </Routes>
      <ToastContainer />
    </>
  );
}
