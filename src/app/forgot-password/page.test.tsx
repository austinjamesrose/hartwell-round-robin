import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Supabase client - use vi.hoisted for variables used in mocks
const mockResetPasswordForEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

// Import component after mocks
import ForgotPasswordPage from "./page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success response
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("renders email input and submit button", () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i })
    ).toBeInTheDocument();
  });

  it("renders page title and description", () => {
    render(<ForgotPasswordPage />);

    // CardTitle renders as div, so search by text
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(
      screen.getByText(/enter your email address and we'll send you a link/i)
    ).toBeInTheDocument();
  });

  it("renders Back to Login link", () => {
    render(<ForgotPasswordPage />);

    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("does not call API when form is empty on submit", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    // Try to submit empty form
    await user.click(submitButton);

    // API should not be called when form is empty/invalid
    await waitFor(() => {
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  it("submitting email calls supabase.auth.resetPasswordForEmail", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
    });
  });

  it("success message displays after successful submission", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    // Should show success view - CardTitle renders as div
    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();

    expect(
      screen.getByText(/if an account exists with that email address/i)
    ).toBeInTheDocument();
  });

  it("shows button loading state during submission", async () => {
    // Delay the response to test loading state
    mockResetPasswordForEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    // Button should show loading text
    expect(screen.getByRole("button", { name: /sending/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    // Wait for completion
    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
  });

  it("shows generic error message when API fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "Some internal error" },
    });

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    // Should show generic error (not revealing if email exists)
    expect(
      await screen.findByText(/unable to send reset email/i)
    ).toBeInTheDocument();
  });

  it("success view has Back to Login link", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    // Wait for success view
    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
