import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronRight, Star, Sun, Moon, LogOut, User, Settings, Command } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useNotificationStore } from "../../store/notification.store";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useFavoritesStore } from "../../store/favorites.store";
import GlobalSearch from "./GlobalSearch";
import GlobalFilterBar from "./GlobalFilterBar";
import QuickActions from "./QuickActions";

const BREADCRUMB_MAP: Record<string, string> = {
  "": "Executive Dashboard",
  "dashboard": "Executive Dashboard",
  "organizations": "Organizations",
  "applications": "Applications",
  "vulnerabilities": "Vulnerabilities",
  "reports": "Reports",
  "risk-management": "Risk Management",
  "waived-accepted-risks": "Waived / Accepted Risks",
  "security": "Security Governance",
  "roadmaps": "Roadmaps & Projects",
  "saas": "SaaS Governance",
  "audits": "Audits",
  "committees": "Committees",
  "admin": "Administration",
  "policy-rules": "Policy Rules",
  "compliance": "Compliance",
  "veg": "VEG Governance",
  "nexus": "Nexus IQ",
  "risk": "Risk Management",
  "ai": "AI Assistant",
};

export default function Header() {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const { dark, toggle } = useDarkMode();
  const { favorites, toggleFavorite, isFavorite, addRecent } = useFavoritesStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((s, i) => ({
    label: BREADCRUMB_MAP[s] || s.charAt(0).toUpperCase() + s.slice(1),
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  useEffect(() => {
    const label = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "Dashboard";
    if (location.pathname !== "/login") addRecent(location.pathname, label);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setNotifOpen(false); setUserMenuOpen(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-500", COMPLIANCE_OFFICER: "bg-blue-500", RISK_MANAGER: "bg-amber-500",
    SECURITY_MANAGER: "bg-red-500", PRODUCT_OWNER: "bg-green-500", AUDITOR: "bg-teal-500", EXECUTIVE_READ_ONLY: "bg-slate-500",
  };

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />}
                <button
                  onClick={() => navigate(crumb.path)}
                  className={`truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                    i === breadcrumbs.length - 1 ? "text-slate-900 dark:text-white font-medium" : ""
                  }`}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </nav>
          <div className="hidden lg:block">
            <QuickActions />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="px-1 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-600 text-slate-400">⌘K</kbd>
          </button>
          <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Search className="w-4 h-4" />
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <button onClick={markAllRead} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">Mark all read</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { markRead(n.id); if (n.link) navigate(n.link); setNotifOpen(false); }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          !n.read ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""
                        }`}
                      >
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          n.type === "error" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : n.type === "success" ? "bg-green-500" : "bg-blue-500"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColors[user?.role || "EXECUTIVE_READ_ONLY"]}`}>
                {user?.name?.charAt(0) || "U"}
              </div>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                    {user?.role || ""}
                  </span>
                </div>
                <button onClick={() => { navigate("/admin"); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button onClick={toggle} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {dark ? "Light" : "Dark"} Mode
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalFilterBar />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
