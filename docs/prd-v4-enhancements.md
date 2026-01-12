# Hartwell Round Robin - PRD v4.0: Post-Testing Enhancements

**Version:** 4.0
**Created:** January 2026
**Status:** Draft
**Based On:** Full Test Review (January 2026), Fix List Feedback

---

## Executive Summary

This PRD addresses bugs, UX improvements, and missing features identified during comprehensive testing of the Hartwell Round Robin application. The testing validated core functionality while revealing opportunities for improved user experience, particularly around navigation, score entry, and data validation.

**Key Themes:**
1. **Bug Fixes** - Resolve validation gaps and UI inconsistencies
2. **Mobile-First Navigation** - Restructure season page for mobile usability
3. **Streamlined Score Entry** - Filter-based approach for efficient data input
4. **Missing Core Feature** - Implement manual player swap capability

---

## Priority Matrix

| Priority | Category | Count |
|----------|----------|-------|
| P0 - Critical | Bug Fixes | 6 |
| P1 - High | Core UX Redesign | 4 |
| P2 - Medium | Feature Additions | 5 |
| P3 - Low | Nice-to-Have | 6 |

---

## P0: Critical Bug Fixes

### US-V4-001: Prevent Duplicate Season Names

**Problem:** System allows creating multiple seasons with identical names, causing confusion.

**User Story:**
As an admin, I want the system to prevent duplicate season names so I can easily distinguish between seasons.

**Acceptance Criteria:**
- [ ] When creating a season, validate name is unique (case-insensitive)
- [ ] Show inline error: "A season with this name already exists"
- [ ] Form submission blocked until name is unique
- [ ] Validation occurs on blur and on submit

**Technical Notes:**
- Add unique constraint check before insert
- Consider trimming whitespace before comparison

---

### US-V4-002: Prevent Duplicate Player Names

**Problem:** System allows adding the same player name twice to a roster, creating duplicate entries.

**User Story:**
As an admin, I want the system to prevent duplicate player names so roster data remains clean.

**Acceptance Criteria:**
- [ ] When adding a player, validate name is unique within the global player pool (case-insensitive)
- [ ] Show inline error: "A player with this name already exists"
- [ ] Suggest using the existing player instead
- [ ] Form submission blocked until resolved

**Technical Notes:**
- Check against global players table
- Consider fuzzy matching for near-duplicates (e.g., "Bob Smith" vs "Bob  Smith")

---

### US-V4-003: Add Confirmation Dialog for Player Removal

**Problem:** Clicking "Remove" immediately removes player from roster with no confirmation.

**User Story:**
As an admin, I want a confirmation before removing a player so I don't accidentally remove someone.

**Acceptance Criteria:**
- [ ] Clicking "Remove" shows confirmation dialog
- [ ] Dialog shows: "Remove [Player Name] from this season's roster?"
- [ ] Dialog has Cancel and Remove buttons
- [ ] Cancel closes dialog with no action
- [ ] Remove executes the removal

---

### US-V4-004: Disable Schedule Generation Below Minimum

**Problem:** Generate Schedule button remains enabled even when below 24 players, leading to potential errors.

**User Story:**
As an admin, I want the Generate Schedule button disabled when player count is invalid so I can't accidentally generate an invalid schedule.

**Acceptance Criteria:**
- [ ] Button disabled when available players < 24
- [ ] Button disabled when available players > 32
- [ ] Disabled state shows tooltip: "Need 24-32 available players"
- [ ] Button visual state clearly indicates disabled (grayed out)
- [ ] Warning message remains visible above button

---

### US-V4-005: Fix Week Tab Highlighting

**Problem:** Week tab highlighting doesn't update when navigating between weeks.

**User Story:**
As an admin, I want the correct week tab highlighted so I always know which week I'm viewing.

**Acceptance Criteria:**
- [ ] Active/selected week tab has distinct visual highlight
- [ ] Highlight updates immediately when clicking different week
- [ ] "(Active Week)" label only appears on the season's active week
- [ ] Works correctly with URL-based navigation (direct links to weeks)

---

### US-V4-006: Fix Timezone/Date Display Issue

**Problem:** Start date may display one day off from what was entered (potential timezone issue).

**User Story:**
As an admin, I want the start date to display exactly as I entered it so schedule dates are accurate.

**Acceptance Criteria:**
- [ ] Date displays match date entered in form
- [ ] No off-by-one errors regardless of user timezone
- [ ] All week dates calculated correctly from start date
- [ ] PDF exports show correct dates

**Technical Notes:**
- Likely need to store/transmit dates as date-only (no time component)
- Consider using UTC midnight or local date handling

---

## P1: Core UX Redesign

### US-V4-007: Season Page Mobile Navigation

**Problem:** Season page displays all content (roster, schedule, leaderboard) in one long scrolling page, making navigation difficult on mobile.

**User Story:**
As an admin on a mobile device, I want clear navigation between season sections so I can quickly access what I need.

**Acceptance Criteria:**
- [ ] Season page has navigation component for: Roster, Schedule, Leaderboard
- [ ] Navigation works on both mobile and desktop
- [ ] On mobile: Bottom navigation bar or hamburger menu
- [ ] On desktop: Horizontal tabs or sidebar (designer's choice)
- [ ] Each section is a separate route (enables bookmarking/sharing)
- [ ] Current section clearly indicated in navigation
- [ ] "Manage Active Week" remains prominent/accessible

**Routes Structure:**
```
/dashboard/seasons/[id]              → Overview/redirect to active week
/dashboard/seasons/[id]/roster       → Roster management
/dashboard/seasons/[id]/schedule     → Week schedule (with week selector)
/dashboard/seasons/[id]/leaderboard  → Standings table
```

**Mobile Design Considerations:**
- Bottom nav bar with icons: 👥 Roster | 📅 Schedule | 🏆 Leaderboard
- Touch targets minimum 44px
- Sticky navigation (doesn't scroll away)

---

### US-V4-008: Score Entry Filter Redesign

**Problem:** Score entry displays all games from all rounds in one long list, making it tedious to navigate.

**User Story:**
As a scorekeeper, I want to filter score entry by round or court so I can quickly find and enter specific game scores.

**Acceptance Criteria:**
- [ ] Two filter options available: By Round, By Court
- [ ] Round filter: Dropdown with "Round 1", "Round 2", etc.
- [ ] Court filter: Dropdown with "Court 1", "Court 2", etc.
- [ ] Only selected filter's games displayed
- [ ] Default: Round 1 selected
- [ ] Filter selection persists during session
- [ ] Clear indication of how many games shown vs total
- [ ] Progress indicator: "X of Y games completed"

**UI Layout:**
```
[Filter by: Round ▼] [Round 1 ▼]  or  [Filter by: Court ▼] [Court 1 ▼]

Showing 6 games | 2 of 6 completed

┌─────────────────────────────────────┐
│ Court 1                             │
│ Team A vs Team B                    │
│ [11] - [7]  [Save]                  │
└─────────────────────────────────────┘
...
```

---

### US-V4-009: Collapsible Roster View

**Problem:** Roster displays as a long list of all players, taking up significant page space.

**User Story:**
As an admin, I want the roster to be collapsible so I can reduce visual clutter when not actively managing players.

**Acceptance Criteria:**
- [ ] Roster section has expand/collapse toggle
- [ ] Collapsed state shows: "[X] players in roster" with expand button
- [ ] Expanded state shows full player list with add/remove functionality
- [ ] Collapse state persists during session
- [ ] Search/filter available when expanded (for large rosters)

**Optional Enhancement:**
- Alphabetical grouping (A-D, E-H, etc.) for rosters > 20 players

---

### US-V4-010: Implement Manual Player Swap

**Problem:** Cannot manually swap players in generated schedule to fix issues or accommodate requests.

**User Story:**
As an admin, I want to swap players in the schedule so I can accommodate special requests or fix constraint violations.

**Acceptance Criteria:**
- [ ] On draft schedule, players are clickable/tappable
- [ ] Clicking a player enters "swap mode" with visual indicator
- [ ] In swap mode, valid swap targets are highlighted
- [ ] Valid targets: any player in same round (other courts or bye list)
- [ ] Clicking second player completes swap
- [ ] Both affected positions update immediately
- [ ] Swap can be undone (Undo button or Ctrl+Z)
- [ ] Warning displayed if swap creates constraint violation
- [ ] "Cancel swap" option to exit swap mode without swapping

**Visual Design:**
- Selected player: highlighted border (blue)
- Valid targets: highlighted background (light green)
- Invalid targets: dimmed/grayed
- Swap mode banner: "Select another player to swap with [Name]"

**Technical Notes:**
- Swap only affects schedule data, not player records
- Constraint checking should evaluate: repeated partnerships, repeated opponents
- Save button required to persist swaps (not auto-save)

---

## P2: Medium Priority Additions

### US-V4-011: PDF Export for Court Score Sheets

**Problem:** No way to print court-specific sheets for teams to record scores manually.

**User Story:**
As an admin, I want to print score sheets for each court so teams can write their scores during play.

**Acceptance Criteria:**
- [ ] "Export Score Sheets" button on finalized schedule
- [ ] Generates PDF with one page per round
- [ ] Each page shows all courts for that round
- [ ] Each court section has:
  - Court number prominently displayed
  - Team 1 players (with space for score)
  - Team 2 players (with space for score)
  - Large blank box for handwritten score entry
- [ ] Season name and week/date in header
- [ ] Designed for 8.5x11" printing

**Layout Example:**
```
┌─────────────────────────────────────────────────────┐
│ Test Season Alpha - Week 1 (Jan 11) - Round 1      │
├─────────────────────────────────────────────────────┤
│ COURT 1                                             │
│                                                     │
│ Team 1: Alice Anderson & Bob Baker     Score: [  ] │
│ Team 2: Carol Chen & David Davis       Score: [  ] │
│                                                     │
├─────────────────────────────────────────────────────┤
│ COURT 2                                             │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

---

### US-V4-012: Bulk Player Import

**Problem:** Adding 30 players one-by-one is tedious.

**User Story:**
As an admin, I want to import multiple players at once so roster setup is faster.

**Acceptance Criteria:**
- [ ] "Bulk Import" button/option on roster page
- [ ] Text area for pasting names (one per line)
- [ ] Preview list before import
- [ ] Duplicate detection with options: Skip, Rename, Cancel
- [ ] Success message: "Added X players. Y duplicates skipped."
- [ ] Works with comma-separated or newline-separated input

---

### US-V4-013: Success Toast Notifications

**Problem:** Many actions complete silently without confirmation feedback.

**User Story:**
As an admin, I want confirmation messages when actions complete so I know my changes were saved.

**Acceptance Criteria:**
- [ ] Toast appears for: Season created, Player added, Score saved, Schedule saved, PDF exported
- [ ] Toast auto-dismisses after 3-4 seconds
- [ ] Toast can be manually dismissed
- [ ] Toast position: bottom-right or top-right (consistent)
- [ ] Success: green styling
- [ ] Error: red styling with longer display time

---

### US-V4-014: Password Requirements Display

**Problem:** Registration form doesn't show password requirements.

**User Story:**
As a new user, I want to see password requirements so I can create a valid password on first try.

**Acceptance Criteria:**
- [ ] Password requirements displayed below password field
- [ ] Requirements listed: minimum length, special characters, etc.
- [ ] Real-time validation checkmarks as requirements met
- [ ] Optional: Password strength indicator (weak/medium/strong)

---

### US-V4-015: Forgot Password Flow

**Problem:** No way to recover account if password forgotten.

**User Story:**
As a user who forgot my password, I want to reset it via email so I can regain access.

**Acceptance Criteria:**
- [ ] "Forgot password?" link on login page
- [ ] Email input form with submit button
- [ ] Email sent with reset link (Supabase built-in)
- [ ] Reset link leads to password reset form
- [ ] Success message after reset
- [ ] Redirect to login after successful reset

---

## P3: Nice-to-Have Enhancements

### US-V4-016: Player Search/Filter

**User Story:**
As an admin with a large roster, I want to search for players by name so I can find them quickly.

**Acceptance Criteria:**
- [ ] Search input on roster page
- [ ] Filters player list in real-time as typing
- [ ] Clear button to reset filter
- [ ] "No players found" message if no matches

---

### US-V4-017: Score Entry Progress Indicator

**User Story:**
As a scorekeeper, I want to see score entry progress so I know how many games remain.

**Acceptance Criteria:**
- [ ] Progress bar or indicator showing completed/total games
- [ ] Updates in real-time as scores are saved
- [ ] Shows percentage and/or count (e.g., "24 of 60 games - 40%")

---

### US-V4-018: Keyboard Navigation in Score Entry

**User Story:**
As a scorekeeper using a keyboard, I want Tab navigation between score fields so I can enter scores efficiently.

**Acceptance Criteria:**
- [ ] Tab moves to next score input
- [ ] Shift+Tab moves to previous
- [ ] Enter on filled score row triggers Save
- [ ] Focus moves to next game after save

---

### US-V4-019: Loading Indicators

**User Story:**
As a user, I want loading indicators during async operations so I know the app is working.

**Acceptance Criteria:**
- [ ] Loading spinner during: Schedule generation, PDF export, Data saves
- [ ] Button shows loading state (spinner replaces text)
- [ ] Prevents double-clicks during loading

---

### US-V4-020: Remember Me Checkbox

**User Story:**
As a returning user, I want my session to persist longer so I don't have to log in frequently.

**Acceptance Criteria:**
- [ ] "Remember me" checkbox on login form
- [ ] If checked, session persists for 30 days
- [ ] If unchecked, session expires on browser close

---

### US-V4-021: Finalize Button Visibility

**User Story:**
As an admin, I want the Finalize Schedule button more visible so I don't have to scroll to find it.

**Acceptance Criteria:**
- [ ] Finalize button visible without scrolling to bottom
- [ ] Options: Sticky footer, button at top of schedule, or floating action button
- [ ] Works on mobile and desktop

---

## Implementation Notes

### Technical Debt Items
1. Review timezone handling across all date operations
2. Add comprehensive form validation layer
3. Consider React Query or SWR for data fetching/caching
4. Add error boundary for graceful error handling

### Testing Requirements
- [ ] Mobile responsiveness testing (375px, 768px, 1024px)
- [ ] Accessibility testing (keyboard nav, screen reader)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] PDF export testing on multiple devices

### Migration Considerations
- None required - all changes are additive or UI modifications
- Existing data remains compatible

---

## Appendix: Test Coverage Summary (v3.0)

| Phase | Feature | Pass/Fail |
|-------|---------|-----------|
| 1 | Authentication | PASS |
| 2 | Season Management | PASS* |
| 3 | Roster Management | PASS* |
| 4 | Availability | PASS |
| 5 | Schedule Generation | PASS |
| 6 | Manual Adjustments | FAIL (not implemented) |
| 7 | Finalize/Unfinalize | PASS |
| 8 | Score Entry | PASS |
| 9 | Edit Scores | PASS |
| 10 | Mark Complete | PASS |
| 11 | Leaderboard | PASS |
| 12 | Player Detail | PASS |
| 13 | Historical Weeks | PARTIAL |
| 14 | PDF Export | PASS |

*Minor bugs identified, addressed in this PRD

---

---

## Appendix: Technical Context for Implementation

This section provides the technical context needed for autonomous implementation.

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| React | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui pattern (custom) | - |
| UI Primitives | Radix UI | - |
| Icons | lucide-react | - |
| Forms | react-hook-form | 7.71.0 |
| Validation | zod | 4.3.5 |
| Toast | sonner | 2.0.7 |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (@supabase/ssr) | - |
| PDF | jspdf | 4.0.0 |
| Testing | Vitest + Testing Library | 4.0.16 |

### Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard home
│   │   ├── players/              # Global player management
│   │   └── seasons/
│   │       ├── new/              # Create season form
│   │       └── [id]/             # Season detail
│   │           ├── page.tsx
│   │           ├── players/[playerId]/  # Player stats
│   │           └── weeks/[weekId]/      # Week management
│   ├── login/
│   └── register/
├── components/
│   └── ui/                       # Shared UI components (shadcn-style)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── switch.tsx
│       ├── tooltip.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   ├── auth/                     # Auth utilities
│   ├── seasons/
│   │   └── validation.ts         # Zod schemas for seasons
│   ├── scheduling/
│   │   └── generateSchedule.ts   # Round-robin algorithm
│   ├── leaderboard/
│   │   └── ranking.ts            # Standings calculation
│   └── pdf/
│       ├── exportSchedulePdf.ts  # Schedule PDF export
│       └── exportStandingsPdf.ts # Standings PDF export
└── types/
    └── database.ts               # Auto-generated Supabase types
```

### Database Schema

**Tables:**
```sql
-- Core entities
seasons (id, admin_id, name, start_date, num_weeks, num_courts, status, created_at, updated_at)
players (id, admin_id, name, created_at, updated_at)  -- Global player pool
season_players (id, season_id, player_id, created_at)  -- Roster membership
weeks (id, season_id, week_number, date, status, schedule_warnings, created_at, updated_at)

-- Game data
games (id, week_id, round_number, court_number,
       team1_player1_id, team1_player2_id,
       team2_player1_id, team2_player2_id,
       team1_score, team2_score, status, created_at, updated_at)
byes (id, week_id, round_number, player_id, created_at)
player_availability (id, week_id, player_id, is_available, created_at)
```

**Status Enums:**
- `season_status`: "active" | "completed" | "archived"
- `week_status`: "draft" | "finalized" | "completed"
- `game_status`: "scheduled" | "completed"

### Component Patterns

**Server Components (default):**
```typescript
// src/app/dashboard/seasons/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SeasonPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', params.id)
    .single();

  return <SeasonDetail season={season} />;
}
```

**Client Components:**
```typescript
// Component with interactivity
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function ScoreEntry({ game }: { game: Game }) {
  const [score, setScore] = useState({ team1: '', team2: '' });
  const supabase = createClient();

  const handleSave = async () => {
    const { error } = await supabase
      .from('games')
      .update({ team1_score: score.team1, team2_score: score.team2 })
      .eq('id', game.id);

    if (error) {
      toast.error('Failed to save score');
    } else {
      toast.success('Score saved');
    }
  };

  return (/* ... */);
}
```

### Form Validation Pattern

```typescript
// src/lib/seasons/validation.ts
import { z } from 'zod';

export const createSeasonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  startDate: z.string().min(1, 'Start date is required'),
  numWeeks: z.number().int().min(1).max(12),
  numCourts: z.number().int().min(4).max(8),
});

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;

// In component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<CreateSeasonInput>({
  resolver: zodResolver(createSeasonSchema),
  defaultValues: { name: '', numWeeks: 7, numCourts: 6 },
});
```

### UI Component Usage

```typescript
// Using shadcn-style components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Icons
import { Plus, Trash2, Download, ChevronDown } from 'lucide-react';
```

### Toast Notifications

```typescript
// Already installed: sonner
import { toast } from 'sonner';

// Usage
toast.success('Season created successfully');
toast.error('Failed to save changes');
toast.info('Schedule generated');
```

### PDF Export Pattern

```typescript
// src/lib/pdf/exportSchedulePdf.ts
import jsPDF from 'jspdf';

export function exportSchedulePdf(season: Season, week: Week, games: Game[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
  });

  // Header
  doc.setFontSize(18);
  doc.text(`${season.name} - Week ${week.week_number}`, 40, 40);

  // Content...

  doc.save(`${season.name}-week-${week.week_number}.pdf`);
}
```

### Key Implementation Notes

1. **Path Alias:** Use `@/` prefix for imports (maps to `src/`)
2. **Naming:** `snake_case` for database, `camelCase` for TypeScript
3. **RLS:** All tables have Row Level Security - queries auto-filter by user
4. **Server vs Client:** Prefer Server Components; use Client only for interactivity
5. **Error Handling:** Use try/catch with toast feedback
6. **Types:** Import from `@/types/database` for type safety

### Files to Reference

For implementation patterns, review these existing files:

| Pattern | Reference File |
|---------|---------------|
| Form with validation | `src/app/dashboard/seasons/new/page.tsx` |
| Client component with Supabase | `src/app/dashboard/seasons/[id]/score-entry.tsx` |
| Server component data fetching | `src/app/dashboard/seasons/[id]/page.tsx` |
| PDF export | `src/lib/pdf/exportSchedulePdf.ts` |
| Dialog/modal | `src/components/ui/dialog.tsx` |
| Tabs navigation | `src/app/dashboard/seasons/[id]/week-navigation.tsx` |

---

*PRD Version: 4.0*
*Based on: Full Test Review (January 2026)*
*Total User Stories: 21*
