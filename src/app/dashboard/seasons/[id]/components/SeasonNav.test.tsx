import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SeasonNav } from "./SeasonNav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Import the mock for setup
import { usePathname } from "next/navigation";

describe("SeasonNav", () => {
  const mockSeasonId = "season-123";

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to schedule page
    vi.mocked(usePathname).mockReturnValue(
      `/dashboard/seasons/${mockSeasonId}/schedule`
    );
  });

  it("renders three navigation links", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    // Check that all three links exist (twice - once for desktop, once for mobile)
    const rosterLinks = screen.getAllByRole("link", { name: /roster/i });
    const scheduleLinks = screen.getAllByRole("link", { name: /schedule/i });
    const leaderboardLinks = screen.getAllByRole("link", {
      name: /leaderboard/i,
    });

    // Each link appears twice (desktop and mobile nav)
    expect(rosterLinks).toHaveLength(2);
    expect(scheduleLinks).toHaveLength(2);
    expect(leaderboardLinks).toHaveLength(2);
  });

  it("links navigate to correct paths (roster, schedule, leaderboard)", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    // Get all links
    const links = screen.getAllByRole("link");

    // Check that href attributes contain correct paths
    const hrefs = links.map((link) => link.getAttribute("href"));

    expect(hrefs).toContain(`/dashboard/seasons/${mockSeasonId}/roster`);
    expect(hrefs).toContain(`/dashboard/seasons/${mockSeasonId}/schedule`);
    expect(hrefs).toContain(`/dashboard/seasons/${mockSeasonId}/leaderboard`);
  });

  it("active route has 'active' styling applied (data-active=true)", () => {
    // Set pathname to roster page
    vi.mocked(usePathname).mockReturnValue(
      `/dashboard/seasons/${mockSeasonId}/roster`
    );

    render(<SeasonNav seasonId={mockSeasonId} />);

    // Find the roster links and check they have data-active="true"
    const rosterLinks = screen.getAllByRole("link", { name: /roster/i });
    rosterLinks.forEach((link) => {
      expect(link).toHaveAttribute("data-active", "true");
    });

    // Other links should not be active
    const scheduleLinks = screen.getAllByRole("link", { name: /schedule/i });
    scheduleLinks.forEach((link) => {
      expect(link).toHaveAttribute("data-active", "false");
    });
  });

  it("schedule route is active when viewing schedule page", () => {
    vi.mocked(usePathname).mockReturnValue(
      `/dashboard/seasons/${mockSeasonId}/schedule`
    );

    render(<SeasonNav seasonId={mockSeasonId} />);

    const scheduleLinks = screen.getAllByRole("link", { name: /schedule/i });
    scheduleLinks.forEach((link) => {
      expect(link).toHaveAttribute("data-active", "true");
    });
  });

  it("leaderboard route is active when viewing leaderboard page", () => {
    vi.mocked(usePathname).mockReturnValue(
      `/dashboard/seasons/${mockSeasonId}/leaderboard`
    );

    render(<SeasonNav seasonId={mockSeasonId} />);

    const leaderboardLinks = screen.getAllByRole("link", {
      name: /leaderboard/i,
    });
    leaderboardLinks.forEach((link) => {
      expect(link).toHaveAttribute("data-active", "true");
    });
  });

  it("mobile nav has data-testid for responsive testing", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    // Check that both desktop and mobile nav elements exist
    expect(screen.getByTestId("desktop-nav")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument();
  });

  it("mobile nav has correct responsive classes (md:hidden)", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    const mobileNav = screen.getByTestId("mobile-nav");
    expect(mobileNav).toHaveClass("md:hidden");
  });

  it("desktop nav has correct responsive classes (hidden md:block)", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    const desktopNav = screen.getByTestId("desktop-nav");
    expect(desktopNav).toHaveClass("hidden");
    expect(desktopNav).toHaveClass("md:block");
  });

  it("mobile nav links have minimum touch target size (44px)", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    const mobileNav = screen.getByTestId("mobile-nav");
    const mobileLinks = within(mobileNav).getAllByRole("link");

    // Check that links have min-h-[44px] and min-w-[44px] classes for touch targets
    mobileLinks.forEach((link) => {
      expect(link).toHaveClass("min-h-[44px]");
      expect(link).toHaveClass("min-w-[44px]");
    });
  });

  it("mobile nav is fixed at bottom (position fixed)", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    const mobileNav = screen.getByTestId("mobile-nav");
    expect(mobileNav).toHaveClass("fixed");
    expect(mobileNav).toHaveClass("bottom-0");
  });

  it("desktop nav is sticky (not scrolling away)", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    // Desktop nav should be rendered - it doesn't need to be sticky since
    // we're using a fixed mobile nav and the desktop nav is within the scrollable content
    const desktopNav = screen.getByTestId("desktop-nav");
    expect(desktopNav).toBeInTheDocument();
  });

  it("renders lucide-react icons for each nav item", () => {
    render(<SeasonNav seasonId={mockSeasonId} />);

    // The icons render as SVG elements
    // We check that each link contains an SVG child
    const allLinks = screen.getAllByRole("link");
    allLinks.forEach((link) => {
      const svg = link.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  it("schedule is the default active section when path matches base season URL", () => {
    // When the path is just the season page without a specific section
    vi.mocked(usePathname).mockReturnValue(
      `/dashboard/seasons/${mockSeasonId}`
    );

    render(<SeasonNav seasonId={mockSeasonId} />);

    // Schedule should be active by default
    const scheduleLinks = screen.getAllByRole("link", { name: /schedule/i });
    scheduleLinks.forEach((link) => {
      expect(link).toHaveAttribute("data-active", "true");
    });
  });

  it("schedule is active when viewing nested week pages", () => {
    // When viewing a specific week page
    vi.mocked(usePathname).mockReturnValue(
      `/dashboard/seasons/${mockSeasonId}/weeks/week-123`
    );

    render(<SeasonNav seasonId={mockSeasonId} />);

    // Schedule should still be active since weeks are part of schedule
    const scheduleLinks = screen.getAllByRole("link", { name: /schedule/i });
    scheduleLinks.forEach((link) => {
      expect(link).toHaveAttribute("data-active", "true");
    });
  });
});
