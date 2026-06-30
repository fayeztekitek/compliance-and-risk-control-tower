import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { auditService } from "../services/audit.service.js";

export function auditMiddleware(action?: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (req.user) {
        const resourceType = req.baseUrl?.split("/").pop() || req.path?.split("/").filter(Boolean).shift();
        auditService.log({
          userId: req.user.id,
          userName: (req as any).userName,
          userRole: req.user.role,
          action: action || `${req.method} ${req.path}`,
          resourceType,
          resourceId: req.params.id || req.params[Object.keys(req.params)[0]],
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          statusCode: res.statusCode,
        });
      }
      return originalJson(body);
    };
    next();
  };
}
