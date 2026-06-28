import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, UserRole } from "../../store/auth.store";
import {
  LayoutDashboard, Briefcase, ShieldAlert, Radar, Map, Cloud,
  FileCheck, Users, Settings, LogOut, FileSignature, Scale, Shield,
  ChevronDown, ChevronRight, Sun, Moon, Building2, AppWindow, Bug,
  FileText, ShieldQuestion, AlertOctagon, CheckSquare, PanelLeftClose, User,
} from "lucide-react";
import { useState } from "react";
import { useDarkMode } from "../../hooks/useDarkMode";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  allowedRoles: UserRole[];
  children?: { label: string; path: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "exec-dashboard", label: "Executive Dashboard", icon: LayoutDashboard, path: "/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "organizations", label: "Organizations", icon: Building2, path: "/organizations", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "applications", label: "Applications", icon: AppWindow, path: "/applications", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug, path: "/vulnerabilities", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "reports", label: "Reports", icon: FileText, path: "/reports", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "risk-mgmt", label: "Risk Management", icon: ShieldQuestion, path: "/risk-management", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "waived", label: "Waived / Accepted Risks", icon: CheckSquare, path: "/waived-accepted-risks", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "compliance", label: "Compliance", icon: Scale, path: "/compliance", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER"] },
  { id: "nexus", label: "Nexus IQ", icon: Radar, path: "/nexus", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
    children: [
      { label: "Overview", path: "/nexus" },
    ],
  },
  { id: "veg", label: "VEG Governance", icon: Briefcase, path: "/veg", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"],
    children: [
      { label: "Deal Register", path: "/veg" },
      { label: "Workflow Requests", path: "/veg/workflow" },
    ],
  },
  { id: "security", label: "Security", icon: ShieldAlert, path: "/security", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "roadmaps", label: "Roadmaps", icon: Map, path: "/roadmaps", allowedRoles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
  { id: "saas", label: "SaaS Governance", icon: Cloud, path: "/saas", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"] },
  { id: "audits", label: "Audits", icon: FileCheck, path: "/audits", allowedRoles: ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
  { id: "committees", label: "Committees", icon: Users, path: "/committees", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
  { id: "policy-rules", label: "Policy Rules", icon: Shield, path: "/policy-rules", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"] },
];

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 100, COMPLIANCE_OFFICER: 80, RISK_MANAGER: 70,
  SECURITY_MANAGER: 60, PRODUCT_OWNER: 50, AUDITOR: 40, EXECUTIVE_READ_ONLY: 30,
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["nexus", "veg"]));
  const { dark, toggle: toggleDark } = useDarkMode();

  if (!user) return null;

  const hasAccess = (item: NavItem) =>
    item.allowedRoles.some(role => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");
  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const visibleItems = NAV_ITEMS.filter(hasAccess);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0" role="navigation" aria-label="Main navigation">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">SD</div>
          <div>
            <p className="font-bold text-sm tracking-tight">Security Dashboard</p>
            <p className="text-[10px] text-slate-400 font-medium">Nexus IQ Lifecycle</p>
          </div>
          </div>
          <button onClick={toggleDark} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title={dark ? "Light mode" : "Dark mode"}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="menu">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expanded.has(item.id);

          return (
            <div key={item.id} role="none">
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleExpand(item.id);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                aria-label={item.label}
                role="menuitem"
                aria-expanded={hasChildren ? isExpanded : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {hasChildren && (
                  isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {hasChildren && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children!.map((child) => (
                    <button
                      key={child.path + child.label}
                      onClick={() => navigate(child.path)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === child.path
                          ? "bg-indigo-500/30 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      aria-label={child.label}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Security Officer</p>
              <p className="text-[11px] text-slate-400 font-medium">Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Collapse sidebar">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
