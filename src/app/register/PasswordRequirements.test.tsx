import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PasswordRequirements,
  validatePasswordRequirements,
  getPasswordStrength,
} from "./PasswordRequirements";

describe("validatePasswordRequirements", () => {
  it("returns all false for empty password", () => {
    const result = validatePasswordRequirements("");
    expect(result).toEqual({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    });
  });

  it("returns minLength: false for password with less than 8 characters", () => {
    const result = validatePasswordRequirements("12345");
    expect(result.minLength).toBe(false);
  });

  it("returns minLength: true for password with 8 or more characters", () => {
    const result = validatePasswordRequirements("12345678");
    expect(result.minLength).toBe(true);
  });

  it("returns hasUppercase: true when password contains uppercase letter", () => {
    const result = validatePasswordRequirements("passwordA");
    expect(result.hasUppercase).toBe(true);
  });

  it("returns hasUppercase: false when password has no uppercase letter", () => {
    const result = validatePasswordRequirements("password123");
    expect(result.hasUppercase).toBe(false);
  });

  it("returns hasLowercase: true when password contains lowercase letter", () => {
    const result = validatePasswordRequirements("PASSWORD1a");
    expect(result.hasLowercase).toBe(true);
  });

  it("returns hasLowercase: false when password has no lowercase letter", () => {
    const result = validatePasswordRequirements("PASSWORD123");
    expect(result.hasLowercase).toBe(false);
  });

  it("returns hasNumber: true when password contains a number", () => {
    const result = validatePasswordRequirements("password1");
    expect(result.hasNumber).toBe(true);
  });

  it("returns hasNumber: false when password has no numbers", () => {
    const result = validatePasswordRequirements("passwordABC");
    expect(result.hasNumber).toBe(false);
  });

  it("returns all true for a valid password", () => {
    const result = validatePasswordRequirements("Password1!");
    expect(result).toEqual({
      minLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
    });
  });
});

describe("getPasswordStrength", () => {
  it("returns 'weak' for password with less than 8 characters", () => {
    expect(getPasswordStrength("short")).toBe("weak");
    expect(getPasswordStrength("1234567")).toBe("weak");
    expect(getPasswordStrength("")).toBe("weak");
  });

  it("returns 'medium' for password with 8-11 characters", () => {
    expect(getPasswordStrength("12345678")).toBe("medium");
    expect(getPasswordStrength("12345678901")).toBe("medium");
  });

  it("returns 'strong' for password with 12 or more characters", () => {
    expect(getPasswordStrength("123456789012")).toBe("strong");
    expect(getPasswordStrength("verylongpassword")).toBe("strong");
  });
});

describe("PasswordRequirements component", () => {
  it("renders all requirement items", () => {
    render(<PasswordRequirements password="" />);

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(
      screen.getByText("At least one uppercase letter")
    ).toBeInTheDocument();
    expect(
      screen.getByText("At least one lowercase letter")
    ).toBeInTheDocument();
    expect(screen.getByText("At least one number")).toBeInTheDocument();
  });

  it("shows gray circle icon when requirement not met", () => {
    render(<PasswordRequirements password="" />);

    // All requirements should show circle icons (not met)
    const circleIcons = screen.getAllByTestId("circle-icon");
    expect(circleIcons.length).toBe(4);
  });

  it("shows green check icon when requirement is met", () => {
    render(<PasswordRequirements password="Password1!" />);

    // All requirements should show check icons (met)
    const checkIcons = screen.getAllByTestId("check-icon");
    expect(checkIcons.length).toBe(4);
  });

  it("shows mix of icons for partially met requirements", () => {
    // Password with 8 chars, lowercase only, no uppercase, no number
    render(<PasswordRequirements password="password" />);

    // Should have check for minLength and hasLowercase
    const checkIcons = screen.getAllByTestId("check-icon");
    expect(checkIcons.length).toBe(2);

    // Should have circle for hasUppercase and hasNumber
    const circleIcons = screen.getAllByTestId("circle-icon");
    expect(circleIcons.length).toBe(2);
  });

  it("does not show strength indicator when password is empty", () => {
    render(<PasswordRequirements password="" />);

    expect(screen.queryByTestId("strength-indicator")).not.toBeInTheDocument();
  });

  it("shows 'Weak' strength for short password", () => {
    render(<PasswordRequirements password="short" />);

    const strengthIndicator = screen.getByTestId("strength-indicator");
    expect(strengthIndicator).toHaveTextContent("Weak");
  });

  it("shows 'Medium' strength for medium-length password", () => {
    render(<PasswordRequirements password="12345678" />);

    const strengthIndicator = screen.getByTestId("strength-indicator");
    expect(strengthIndicator).toHaveTextContent("Medium");
  });

  it("shows 'Strong' strength for long password", () => {
    render(<PasswordRequirements password="verylongpassword123" />);

    const strengthIndicator = screen.getByTestId("strength-indicator");
    expect(strengthIndicator).toHaveTextContent("Strong");
  });

  it("updates indicators in real-time as password changes", () => {
    const { rerender } = render(<PasswordRequirements password="" />);

    // Initially all requirements not met
    expect(screen.getAllByTestId("circle-icon").length).toBe(4);

    // Update with partial password
    rerender(<PasswordRequirements password="Pass1" />);

    // Now has uppercase, lowercase, number, but not length
    const checkIcons = screen.getAllByTestId("check-icon");
    expect(checkIcons.length).toBe(3); // uppercase, lowercase, number

    const circleIcons = screen.getAllByTestId("circle-icon");
    expect(circleIcons.length).toBe(1); // minLength

    // Update with full valid password
    rerender(<PasswordRequirements password="Password1!" />);

    // All requirements met
    expect(screen.getAllByTestId("check-icon").length).toBe(4);
    expect(screen.queryAllByTestId("circle-icon").length).toBe(0);
  });
});
