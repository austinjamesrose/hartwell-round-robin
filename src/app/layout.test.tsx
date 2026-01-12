import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the Google fonts since they make network requests
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// Mock sonner's Toaster to inspect props
vi.mock("sonner", () => ({
  Toaster: ({ position, duration }: { position: string; duration: number }) => (
    <div
      data-testid="toaster"
      data-position={position}
      data-duration={duration}
    />
  ),
}));

// Import after mocks
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders Toaster component", () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );

    const toaster = screen.getByTestId("toaster");
    expect(toaster).toBeInTheDocument();
  });

  it("Toaster is configured with position='bottom-right'", () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );

    const toaster = screen.getByTestId("toaster");
    expect(toaster).toHaveAttribute("data-position", "bottom-right");
  });

  it("Toaster is configured with 4 second duration (4000ms)", () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );

    const toaster = screen.getByTestId("toaster");
    expect(toaster).toHaveAttribute("data-duration", "4000");
  });

  it("renders children", () => {
    render(
      <RootLayout>
        <div>Test Child Content</div>
      </RootLayout>
    );

    expect(screen.getByText("Test Child Content")).toBeInTheDocument();
  });
});
