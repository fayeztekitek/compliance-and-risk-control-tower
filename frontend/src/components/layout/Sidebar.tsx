import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, UserRole } from "../../store/auth.store";
import {
  LayoutDashboard, Briefcase, ShieldAlert, Radar, Map, Cloud,
  FileCheck, Users, Settings, LogOut, FileSignature, Scale, Shield,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  allowedRoles: UserRole[];
  children?: { label: string; path: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "nexus", label: "Nexus IQ", icon: Radar, path: "/nexus", allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
    children: [
      { label: "Overview", path: "/nexus" },
      { label: "Applications", path: "/nexus" },
      { label: "Reports", path: "/nexus" },
      { label: "Vulnerabilities", path: "/nexus" },
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
  { id: "compliance", label: "Compliance", icon: Scale, path: "/compliance", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "admin", label: "Administration", icon: Settings, path: "/admin", allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER"] },
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
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">RC</div>
          <div>
            <p className="font-bold text-sm tracking-tight">RiskTower</p>
            <p className="text-[10px] text-slate-400 font-medium">Compliance Control</p>
          </div>
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
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 font-medium">{user.role.replace(/_/g, " ")}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
