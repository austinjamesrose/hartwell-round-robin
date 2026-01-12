import { describe, it, expect } from "vitest";
import {
  isPublicRoute,
  isAuthRoute,
  getAuthRedirect,
  PUBLIC_ROUTES,
  AUTH_ROUTES,
} from "./routes";

describe("isPublicRoute", () => {
  it("returns true for exact public routes", () => {
    PUBLIC_ROUTES.forEach((route) => {
      expect(isPublicRoute(route)).toBe(true);
    });
  });

  it("returns true for nested paths under public routes", () => {
    // /auth/callback/something should still be public
    expect(isPublicRoute("/auth/callback/something")).toBe(true);
  });

  it("returns false for protected routes", () => {
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(isPublicRoute("/seasons")).toBe(false);
    expect(isPublicRoute("/seasons/123")).toBe(false);
    expect(isPublicRoute("/settings")).toBe(false);
  });

  it("returns false for routes that partially match public routes", () => {
    // /loginpage is NOT the same as /login
    expect(isPublicRoute("/loginpage")).toBe(false);
    expect(isPublicRoute("/registerme")).toBe(false);
  });
});

describe("isAuthRoute", () => {
  it("returns true for login and register routes", () => {
    AUTH_ROUTES.forEach((route) => {
      expect(isAuthRoute(route)).toBe(true);
    });
  });

  it("returns false for other routes", () => {
    expect(isAuthRoute("/")).toBe(false);
    expect(isAuthRoute("/dashboard")).toBe(false);
    expect(isAuthRoute("/auth/callback")).toBe(false);
  });
});

describe("getAuthRedirect", () => {
  describe("authenticated user", () => {
    it("redirects to dashboard when accessing login page", () => {
      expect(getAuthRedirect("/login", true)).toBe("dashboard");
    });

    it("redirects to dashboard when accessing register page", () => {
      expect(getAuthRedirect("/register", true)).toBe("dashboard");
    });

    it("allows access to public routes (no redirect)", () => {
      expect(getAuthRedirect("/", true)).toBe(null);
      expect(getAuthRedirect("/auth/callback", true)).toBe(null);
    });

    it("allows access to protected routes (no redirect)", () => {
      expect(getAuthRedirect("/dashboard", true)).toBe(null);
      expect(getAuthRedirect("/seasons", true)).toBe(null);
      expect(getAuthRedirect("/seasons/123/weeks/1", true)).toBe(null);
    });
  });

  describe("unauthenticated user", () => {
    it("allows access to public routes (no redirect)", () => {
      expect(getAuthRedirect("/", false)).toBe(null);
      expect(getAuthRedirect("/login", false)).toBe(null);
      expect(getAuthRedirect("/register", false)).toBe(null);
      expect(getAuthRedirect("/auth/callback", false)).toBe(null);
    });

    it("redirects to login when accessing protected routes", () => {
      expect(getAuthRedirect("/dashboard", false)).toBe("login");
      expect(getAuthRedirect("/seasons", false)).toBe("login");
      expect(getAuthRedirect("/seasons/123", false)).toBe("login");
      expect(getAuthRedirect("/settings", false)).toBe("login");
    });
  });
});
