import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, UserRole } from "../../store/auth.store";
import {
  LayoutDashboard, Briefcase, ShieldAlert, Radar, Map, Cloud,
  FileCheck, Users, Settings, LogOut, FileSignature, Scale, Shield,
  ChevronDown, ChevronRight, Sun, Moon, Building2, AppWindow, Bug,
  FileText, ShieldQuestion, AlertOctagon, CheckSquare, PanelLeftClose, PanelRightClose, User,
  Star, Clock, Command, BarChart3, ScrollText, Siren, Bot, BookOpen, Plug, FileSpreadsheet, GitBranch,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useFavoritesStore } from "../../store/favorites.store";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  allowedRoles: UserRole[];
  children?: { label: string; path: string }[];
  comingSoon?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Executive",
    items: [
      { id: "exec-dashboard", label: "Executive Dashboard", icon: LayoutDashboard, path: "/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "exec-reports", label: "Executive Reports", icon: FileText, path: "/executive/reports", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "report-engine", label: "Report Engine", icon: FileSpreadsheet, path: "/reports/engine", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER"] },
      { id: "alerts", label: "Alerts & Notifications", icon: Siren, path: "/executive/alerts", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"] },
    ],
  },
  {
    title: "Organizations",
    items: [
      { id: "organizations", label: "Organizations", icon: Building2, path: "/organizations", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "applications", label: "Applications", icon: AppWindow, path: "/applications", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "nexus", label: "Nexus IQ", icon: Radar, path: "/nexus", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
        children: [
          { label: "Overview", path: "/nexus" },
          { label: "Applications", path: "/nexus" },
          { label: "Reports", path: "/nexus" },
        ],
      },
    ],
  },
  {
    title: "VEG Governance",
    items: [
      { id: "veg-dashboard", label: "COMEX Dashboard", icon: BarChart3, path: "/veg/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
      { id: "veg", label: "Deal Register", icon: Briefcase, path: "/veg/list", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"],
        children: [
          { label: "Deal List", path: "/veg/list" },
          { label: "Workflow Requests", path: "/veg/workflow" },
          { label: "Decisions", path: "/veg/decisions" },
        ],
      },
      { id: "veg-negotiation", label: "Client Negotiation", icon: FileSignature, path: "/veg/negotiation", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER"] },
      { id: "veg-documents", label: "Documents", icon: ScrollText, path: "/veg/documents", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
      { id: "veg-actions", label: "Action Tracker", icon: CheckSquare, path: "/veg/actions", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER"] },
    ],
  },
  {
    title: "Security Governance",
    items: [
      { id: "sec-dashboard", label: "Dashboard", icon: ShieldAlert, path: "/security/dashboard", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug, path: "/vulnerabilities", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "risk-mgmt", label: "Risk Management", icon: ShieldQuestion, path: "/risk-management", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "waived", label: "Waived / Accepted Risks", icon: CheckSquare, path: "/waived-accepted-risks", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "policy-rules", label: "Policy Rules", icon: Shield, path: "/policy-rules", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"] },
      { id: "reports", label: "Security Reports", icon: FileText, path: "/reports", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "security", label: "Security Console", icon: ShieldAlert, path: "/security", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "pipelines", label: "CI/CD Pipelines", icon: GitBranch, path: "/pipelines", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "SECURITY_MANAGER", "RISK_MANAGER"] },
    ],
  },
  {
    title: "Roadmaps Monitoring",
    items: [
      { id: "roadmaps-dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/roadmaps/dashboard", allowedRoles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
      { id: "roadmaps", label: "Roadmaps", icon: Map, path: "/roadmaps", allowedRoles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
    ],
  },
  {
    title: "Projects Monitoring",
    items: [
      { id: "proj-dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/projects/dashboard", allowedRoles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
      { id: "projects", label: "Projects", icon: Briefcase, path: "/projects", allowedRoles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
    ],
  },
  {
    title: "SaaS Governance",
    items: [
      { id: "saas-dashboard", label: "Dashboard", icon: Cloud, path: "/saas/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"] },
      { id: "saas", label: "SaaS Applications", icon: Cloud, path: "/saas", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"] },
    ],
  },
  {
    title: "Compliance",
    items: [
      { id: "comp-dashboard", label: "Dashboard", icon: Scale, path: "/compliance/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "compliance", label: "Compliance Register", icon: Scale, path: "/compliance", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "comp-controls", label: "Compliance Controls", icon: Shield, path: "/compliance/controls", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "AUDITOR"] },
    ],
  },
  {
    title: "Audits",
    items: [
      { id: "audit-dashboard", label: "Dashboard", icon: FileCheck, path: "/audits/dashboard", allowedRoles: ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
      { id: "audits", label: "Audits", icon: FileCheck, path: "/audits", allowedRoles: ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
    ],
  },
  {
    title: "Committees",
    items: [
      { id: "comm-dashboard", label: "Dashboard", icon: Users, path: "/committees/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
      { id: "committees", label: "Committees", icon: Users, path: "/committees", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
    ],
  },
  {
    title: "Risk",
    items: [
      { id: "risk-dashboard", label: "Dashboard (KRIs)", icon: AlertOctagon, path: "/risk/dashboard", allowedRoles: ["ADMIN", "RISK_MANAGER", "COMPLIANCE_OFFICER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"] },
      { id: "risk-register", label: "Risk Register", icon: ShieldQuestion, path: "/risk/register", allowedRoles: ["ADMIN", "RISK_MANAGER", "COMPLIANCE_OFFICER", "SECURITY_MANAGER"] },
    ],
  },
  {
    title: "AI Hub",
    items: [
      { id: "ai-hub", label: "AI Hub", icon: Command, path: "/ai", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
      { id: "ai-prompts", label: "Prompt Library", icon: FileText, path: "/ai/prompts", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER"] },
      { id: "ai-agents", label: "AI Agents", icon: Bot, path: "/ai/agents", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"] },
      { id: "ai-kb", label: "Knowledge Base", icon: BookOpen, path: "/ai/knowledge-base", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"] },
      { id: "ai-connectors", label: "MCP Connectors", icon: Plug, path: "/ai/connectors", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER"] },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "admin", label: "Settings", icon: Settings, path: "/admin", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER"] },
    ],
  },
];

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 200, ADMIN: 100, COMPLIANCE_OFFICER: 80, RISK_MANAGER: 70,
  SECURITY_MANAGER: 60, PRODUCT_OWNER: 50, AUDITOR: 40, EXECUTIVE_READ_ONLY: 30, GDPR_OFFICER: 25, DEVELOPER: 20,
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { favorites, toggleFavorite, isFavorite, recentPages } = useFavoritesStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["veg", "nexus"]));
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("open-search"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null;

  const hasAccess = (item: NavItem) =>
    item.allowedRoles.some((role) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");
  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const allVisibleItems = NAV_GROUPS.flatMap((g) => g.items).filter(hasAccess);
  const favoriteItems = favorites.filter((f) => allVisibleItems.some((v) => v.path === f.path));

  if (collapsed) {
    return (
      <aside className="w-14 bg-slate-900 text-white flex flex-col shrink-0 items-center py-3" role="navigation" aria-label="Main navigation">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm mb-4">CT</div>
        <nav className="flex-1 flex flex-col items-center gap-1 px-1">
          {NAV_GROUPS.flatMap((g) => g.items.filter(hasAccess)).slice(0, 12).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`p-2 rounded-lg transition-colors ${active ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </nav>
        <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mt-auto" title="Expand sidebar">
          <PanelRightClose className="w-4 h-4" />
        </button>
        <button onClick={toggleDark} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mt-1" title={dark ? "Light mode" : "Dark mode"}>
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0" role="navigation" aria-label="Main navigation">
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">CT</div>
            <div className="min-w-0">
              <p className="font-bold text-sm tracking-tight truncate">Control Tower</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">Enterprise GRC Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Collapse sidebar">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1 scrollbar-thin">
        {favoriteItems.length > 0 && (
          <div className="mb-2">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Star className="w-3 h-3" /> Favorites
            </div>
            {favoriteItems.map((fav) => (
              <button
                key={fav.path}
                onClick={() => navigate(fav.path)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  location.pathname === fav.path ? "bg-indigo-600/30 text-indigo-300" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Star className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{fav.label}</span>
              </button>
            ))}
            <div className="mx-2 mt-1.5 mb-1 border-t border-slate-800" />
          </div>
        )}

        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(hasAccess);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expanded.has(item.id);
                const fav = isFavorite(item.path);

                  return (
                    <div key={item.id}>
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (item.comingSoon) return;
                            if (hasChildren) {
                              toggleExpand(item.id);
                            } else {
                              navigate(item.path);
                            }
                          }}
                          className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            active ? "bg-indigo-600 text-white" : item.comingSoon ? "text-slate-500 cursor-default" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.comingSoon && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">Soon</span>
                          )}
                        </div>
                        {hasChildren && (
                          isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleFavorite({ id: item.id, label: item.label, path: item.path })}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          fav ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                        }`}
                        title={fav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    </div>
                    {hasChildren && isExpanded && (
                      <div className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                        {item.children!.map((child) => (
                          <button
                            key={child.path + child.label}
                            onClick={() => navigate(child.path)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                              location.pathname === child.path
                                ? "bg-indigo-500/30 text-indigo-300"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="my-1.5" />
            </div>
          );
        })}
      </nav>

      {recentPages.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-800">
          <div className="px-1 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Recent
          </div>
          {recentPages.map((r) => (
            <button
              key={r.path}
              onClick={() => navigate(r.path)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">{r.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">
            {user.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user.name || "User"}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user.role?.replace(/_/g, " ") || ""}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
