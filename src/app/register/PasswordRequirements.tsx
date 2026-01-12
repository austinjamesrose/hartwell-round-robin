"use client";

import { Check, Circle } from "lucide-react";

/**
 * Password requirements based on the registration form validation schema.
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */

export interface PasswordRequirementsResult {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

/**
 * Validates a password against all requirements.
 * Returns an object indicating which requirements are met.
 */
export function validatePasswordRequirements(
  password: string
): PasswordRequirementsResult {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Calculates password strength based on length.
 * - Weak: < 8 characters
 * - Medium: 8-12 characters
 * - Strong: 12+ characters
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return "weak";
  } else if (password.length < 12) {
    return "medium";
  } else {
    return "strong";
  }
}

interface RequirementItemProps {
  met: boolean;
  label: string;
}

function RequirementItem({ met, label }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check
          className="h-4 w-4 text-green-500"
          data-testid="check-icon"
          aria-hidden="true"
        />
      ) : (
        <Circle
          className="h-4 w-4 text-gray-400"
          data-testid="circle-icon"
          aria-hidden="true"
        />
      )}
      <span className={met ? "text-green-700" : "text-gray-600"}>{label}</span>
    </div>
  );
}

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = validatePasswordRequirements(password);
  const strength = getPasswordStrength(password);

  // Only show strength indicator if password has been entered
  const showStrength = password.length > 0;

  const strengthStyles = {
    weak: { color: "text-red-600", label: "Weak" },
    medium: { color: "text-yellow-600", label: "Medium" },
    strong: { color: "text-green-600", label: "Strong" },
  };

  return (
    <div
      className="mt-2 space-y-2 rounded-md bg-gray-50 p-3"
      data-testid="password-requirements"
    >
      <p className="text-xs font-medium text-gray-700">Password must have:</p>
      <div className="space-y-1">
        <RequirementItem
          met={requirements.minLength}
          label="At least 8 characters"
        />
        <RequirementItem
          met={requirements.hasUppercase}
          label="At least one uppercase letter"
        />
        <RequirementItem
          met={requirements.hasLowercase}
          label="At least one lowercase letter"
        />
        <RequirementItem met={requirements.hasNumber} label="At least one number" />
      </div>
      {showStrength && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Strength:{" "}
            <span
              className={`font-medium ${strengthStyles[strength].color}`}
              data-testid="strength-indicator"
            >
              {strengthStyles[strength].label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
