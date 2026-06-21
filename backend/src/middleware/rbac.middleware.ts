import { Response, NextFunction } from "express";
import { ForbiddenError } from "../core/errors.js";
import { AuthenticatedRequest } from "./auth.middleware.js";

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 100,
  COMPLIANCE_OFFICER: 80,
  RISK_MANAGER: 70,
  SECURITY_MANAGER: 60,
  PRODUCT_OWNER: 50,
  AUDITOR: 40,
  EXECUTIVE_READ_ONLY: 30,
};

const PERMISSION_MATRIX: Record<string, string[]> = {
  dashboard: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
  veg: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"],
  security: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
  nexus: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"],
  roadmaps: ["ADMIN", "PRODUCT_OWNER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"],
  saas: ["ADMIN", "COMPLIANCE_OFFICER", "PRODUCT_OWNER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"],
  audits: ["ADMIN", "AUDITOR", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"],
  committees: ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"],
  admin: ["ADMIN", "COMPLIANCE_OFFICER"],
};

export function rbacMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError("Authentication required");
    }

    const userRole = req.user.role;
    const hasAccess = allowedRoles.some(role => {
      return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role];
    });

    if (!hasAccess) {
      throw new ForbiddenError(`Role '${userRole}' does not have permission for this resource`);
    }

    next();
  };
}

export function hasPermission(role: string, resource: string): boolean {
  const allowed = PERMISSION_MATRIX[resource];
  if (!allowed) return false;
  return allowed.some(r => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[r]);
}

export { PERMISSION_MATRIX, ROLE_HIERARCHY };
