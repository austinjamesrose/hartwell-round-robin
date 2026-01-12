import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase client - use vi.hoisted for variables used in mocks
const mockGetSession = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}));

// Import component after mocks
import ResetPasswordPage from "./page";

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid session
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "test-user-id" } } },
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("shows loading state initially while checking session", () => {
    // Never resolve to keep it in loading state
    mockGetSession.mockImplementation(() => new Promise(() => {}));

    render(<ResetPasswordPage />);

    expect(screen.getByText(/verifying reset link/i)).toBeInTheDocument();
  });

  it("renders password and confirm password fields with valid session", async () => {
    render(<ResetPasswordPage />);

    // Wait for session check to complete and form to appear
    expect(await screen.findByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i })
    ).toBeInTheDocument();
  });

  it("renders page title with valid session", async () => {
    render(<ResetPasswordPage />);

    // Wait for form to appear, then check title
    await screen.findByLabelText(/^new password/i);

    // CardTitle renders as div, so search by text
    expect(screen.getByText("Set New Password")).toBeInTheDocument();
  });

  it("shows invalid link error when no session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    render(<ResetPasswordPage />);

    // Wait for the invalid state to appear
    expect(await screen.findByText("Invalid Reset Link")).toBeInTheDocument();

    expect(
      screen.getByText(/this password reset link is invalid or has expired/i)
    ).toBeInTheDocument();

    // Should have link to request new reset
    const resetLink = screen.getByRole("link", { name: /request new reset link/i });
    expect(resetLink).toHaveAttribute("href", "/forgot-password");
  });

  it("shows error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordInput = await screen.findByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", { name: /update password/i });

    await user.type(passwordInput, "Password123");
    await user.type(confirmInput, "DifferentPassword123");
    await user.click(submitButton);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows error for password that doesn't meet requirements", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordInput = await screen.findByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", { name: /update password/i });

    // Too short password
    await user.type(passwordInput, "short");
    await user.type(confirmInput, "short");
    await user.click(submitButton);

    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("submitting matching passwords calls supabase.auth.updateUser", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordInput = await screen.findByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", { name: /update password/i });

    await user.type(passwordInput, "NewPassword123");
    await user.type(confirmInput, "NewPassword123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "NewPassword123",
      });
    });
  });

  it("redirects to login with success param after password update", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordInput = await screen.findByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", { name: /update password/i });

    await user.type(passwordInput, "NewPassword123");
    await user.type(confirmInput, "NewPassword123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?reset=success");
    });
  });

  it("shows error message when update fails", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "Update failed" },
    });

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordInput = await screen.findByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", { name: /update password/i });

    await user.type(passwordInput, "NewPassword123");
    await user.type(confirmInput, "NewPassword123");
    await user.click(submitButton);

    expect(await screen.findByText(/update failed/i)).toBeInTheDocument();
  });

  it("shows loading state during form submission", async () => {
    mockUpdateUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordInput = await screen.findByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", { name: /update password/i });

    await user.type(passwordInput, "NewPassword123");
    await user.type(confirmInput, "NewPassword123");
    await user.click(submitButton);

    // Button should show loading text
    expect(screen.getByRole("button", { name: /updating/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /updating/i })).toBeDisabled();
  });

  it("renders Back to Login link", async () => {
    render(<ResetPasswordPage />);

    // Wait for form to appear
    await screen.findByLabelText(/^new password/i);

    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
