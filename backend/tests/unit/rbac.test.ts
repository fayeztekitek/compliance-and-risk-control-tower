import { describe, it, expect } from "vitest";
import { ROLE_HIERARCHY, PERMISSION_MATRIX, hasPermission } from "../../src/middleware/rbac.middleware";

describe("RBAC", () => {
  it("should define all 7 roles in hierarchy", () => {
    expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(7);
    expect(ROLE_HIERARCHY).toHaveProperty("ADMIN");
    expect(ROLE_HIERARCHY).toHaveProperty("EXECUTIVE_READ_ONLY");
  });

  it("should allow ADMIN access to all resources", () => {
    Object.keys(PERMISSION_MATRIX).forEach((resource) => {
      expect(hasPermission("ADMIN", resource)).toBe(true);
    });
  });

  it("should deny EXECUTIVE_READ_ONLY access to admin", () => {
    expect(hasPermission("EXECUTIVE_READ_ONLY", "admin")).toBe(false);
  });

  it("should allow SECURITY_MANAGER access to security and nexus", () => {
    expect(hasPermission("SECURITY_MANAGER", "security")).toBe(true);
    expect(hasPermission("SECURITY_MANAGER", "nexus")).toBe(true);
  });

  it("should allow PRODUCT_OWNER access to audits (hierarchy inherits from AUDITOR)", () => {
    // PRODUCT_OWNER (50) > AUDITOR (40), so inherits audit permission
    expect(hasPermission("PRODUCT_OWNER", "audits")).toBe(true);
  });

  it("should allow COMPLIANCE_OFFICER access to admin", () => {
    expect(hasPermission("COMPLIANCE_OFFICER", "admin")).toBe(true);
  });

  it("should handle unknown resources gracefully", () => {
    expect(hasPermission("ADMIN", "unknown-resource")).toBe(false);
  });
});
