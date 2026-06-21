import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "../../src/core/errors";

describe("AppError", () => {
  it("should create an AppError with correct properties", () => {
    const error = new AppError(400, "TEST_ERROR", "Something went wrong", { field: "name" });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("Something went wrong");
    expect(error.details).toEqual({ field: "name" });
  });

  it("should create NotFoundError with correct status", () => {
    const error = new NotFoundError("User", "123");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toContain("User");
    expect(error.message).toContain("123");
  });

  it("should create ValidationError with details", () => {
    const error = new ValidationError("Invalid input", { min: 3 });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ min: 3 });
  });

  it("should create UnauthorizedError with default message", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Authentication required");
  });

  it("should create ForbiddenError", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("should create ConflictError", () => {
    const error = new ConflictError("Already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.message).toBe("Already exists");
  });
});
