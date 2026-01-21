"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, Trophy, Settings } from "lucide-react";

// Navigation items for season sections
const navItems = [
  { href: "roster", label: "Roster", icon: Users },
  { href: "schedule", label: "Schedule", icon: Calendar },
  { href: "leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "settings", label: "Settings", icon: Settings },
] as const;

interface SeasonNavProps {
  seasonId: string;
}

/**
 * SeasonNav component provides navigation between season sections.
 *
 * - On mobile (< 768px): Fixed bottom navigation bar with icons
 * - On desktop (>= 768px): Horizontal tabs below season header
 */
export function SeasonNav({ seasonId }: SeasonNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/seasons/${seasonId}`;

  // Determine which section is currently active based on the pathname
  const getCurrentSection = () => {
    if (pathname.includes("/roster")) return "roster";
    if (pathname.includes("/leaderboard")) return "leaderboard";
    if (pathname.includes("/settings")) return "settings";
    // Default to schedule (covers /schedule and any week pages under it)
    return "schedule";
  };

  const currentSection = getCurrentSection();

  return (
    <>
      {/* Desktop Navigation - horizontal tabs */}
      <nav
        className="hidden md:block mb-6"
        aria-label="Season navigation"
        data-testid="desktop-nav"
      >
        <div className="flex gap-1 border-b">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = currentSection === href;
            return (
              <Link
                key={href}
                href={`${basePath}/${href}`}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
                  border-b-2 -mb-[2px]
                  ${isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                  }
                `}
                data-active={isActive}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation - fixed bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t"
        aria-label="Season navigation"
        data-testid="mobile-nav"
      >
        <div className="flex justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = currentSection === href;
            return (
              <Link
                key={href}
                href={`${basePath}/${href}`}
                className={`
                  flex flex-col items-center justify-center gap-1 py-2 px-4
                  min-h-[44px] min-w-[44px]
                  text-xs font-medium transition-colors
                  ${isActive
                    ? "text-blue-600"
                    : "text-muted-foreground"
                  }
                `}
                data-active={isActive}
              >
                <Icon className={`size-5 ${isActive ? "text-blue-600" : ""}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile to prevent content from being hidden by fixed nav */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </>
  );
}
