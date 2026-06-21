import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, UserRole } from "../../store/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 100,
  COMPLIANCE_OFFICER: 80,
  RISK_MANAGER: 70,
  SECURITY_MANAGER: 60,
  PRODUCT_OWNER: 50,
  AUDITOR: 40,
  EXECUTIVE_READ_ONLY: 30,
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const hasAccess = allowedRoles.some(role =>
      ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]
    );
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
