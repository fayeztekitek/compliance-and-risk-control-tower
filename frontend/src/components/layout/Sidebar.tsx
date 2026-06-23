import { useAuthStore, UserRole } from "../../store/auth.store";
import {
  LayoutDashboard,
  Briefcase,
  ShieldAlert,
  Radar,
  Map,
  Cloud,
  FileCheck,
  Users,
  Settings,
  LogOut,
  FileSignature,
  Scale,
  Shield,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "veg", label: "VEG Governance", icon: Briefcase, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
  { id: "veg-workflow", label: "VEG Workflow", icon: FileSignature, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
  { id: "security", label: "Security", icon: ShieldAlert, allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "nexus", label: "Nexus IQ", icon: Radar, allowedRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "roadmaps", label: "Roadmaps", icon: Map, allowedRoles: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
  { id: "saas", label: "SaaS Governance", icon: Cloud, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"] },
  { id: "audits", label: "Audits", icon: FileCheck, allowedRoles: ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"] },
  { id: "committees", label: "Committees", icon: Users, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"] },
  { id: "policy-rules", label: "Policy Rules", icon: Shield, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"] },
  { id: "compliance", label: "Compliance", icon: Scale, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"] },
  { id: "admin", label: "Administration", icon: Settings, allowedRoles: ["ADMIN", "COMPLIANCE_OFFICER"] },
];

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 100,
  COMPLIANCE_OFFICER: 80,
  RISK_MANAGER: 70,
  SECURITY_MANAGER: 60,
  PRODUCT_OWNER: 50,
  AUDITOR: 40,
  EXECUTIVE_READ_ONLY: 30,
};

interface SidebarProps {
  currentView: string;
  onSetView: (view: string) => void;
}

export default function Sidebar({ currentView, onSetView }: SidebarProps) {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const hasAccess = (item: NavItem) => {
    return item.allowedRoles.some(role =>
      ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]
    );
  };

  const visibleItems = NAV_ITEMS.filter(hasAccess);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">
            RC
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">RiskTower</p>
            <p className="text-[10px] text-slate-400 font-medium">Compliance Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSetView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 font-medium">{user.role.replace(/_/g, " ")}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
