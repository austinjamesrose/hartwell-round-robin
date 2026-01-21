# Hartwell Round Robin

A Next.js application for managing pickleball round robin leagues.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS + shadcn/ui components
- **Testing:** Vitest + React Testing Library
- **PDF Export:** jsPDF

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/
│   │   │   ├── seasons/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── components/    # Season-specific components
│   │   │   │   │   ├── leaderboard/   # Player rankings
│   │   │   │   │   ├── roster/        # Player roster management
│   │   │   │   │   ├── schedule/      # Week list
│   │   │   │   │   ├── settings/      # Season settings (rounds per week)
│   │   │   │   │   └── weeks/[weekId] # Week schedule management
│   │   │   │   └── new/               # Create new season
│   │   │   └── players/               # Global player management
│   │   └── (auth pages)
│   ├── components/ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── auth/               # Authentication helpers
│   │   ├── availability/       # Player availability logic
│   │   ├── games/              # Game management
│   │   ├── leaderboard/        # Ranking calculations
│   │   ├── pdf/                # PDF export functions
│   │   ├── players/            # Player validation
│   │   ├── scheduling/         # Schedule generation algorithm
│   │   ├── scores/             # Score entry logic
│   │   ├── seasons/            # Season validation
│   │   ├── supabase/           # Supabase client utilities
│   │   └── weeks/              # Week management
│   └── types/
│       └── database.ts         # TypeScript types for Supabase
├── docs/
│   └── USER_GUIDE.md           # End-user documentation
├── supabase/
│   ├── schema.sql              # Full database schema (for new setups)
│   └── migrations/             # Incremental schema changes
└── archive/                    # Historical files from initial build
```

## Key Features

### Schedule Generation (`src/lib/scheduling/generateSchedule.ts`)

The core algorithm generates round robin schedules with these constraints:
- **Default mode:** 8 games per player, rounds auto-calculated
- **Fixed rounds mode:** Specified number of rounds, games per player varies

Key functions:
- `generateSchedule(playerIds, numCourts, targetRounds?)` - Main entry point
- `calculateExpectedGamesPerPlayer(numPlayers, numCourts, targetRounds?)` - Helper for UI
- `validateScheduleConstraints(schedule, playerIds, expectedGames?)` - Post-edit validation

### Rounds Per Week Setting

Seasons have an optional `rounds_per_week` setting:
- `null` = auto-calculate for 8 games per player
- `1-20` = fixed number of rounds

This affects schedule generation but not existing schedules. Editable anytime via Settings page.

**Database column:** `seasons.rounds_per_week INTEGER DEFAULT NULL`

## Database Schema

Key tables (see `supabase/schema.sql`):
- `seasons` - League seasons with configuration
- `players` - Global player pool per admin
- `season_players` - Junction table linking players to seasons
- `weeks` - Weekly schedules within seasons
- `games` - Individual game matchups with scores
- `byes` - Players sitting out each round
- `player_availability` - Per-week player availability

**Migrations:** Schema changes are tracked in `supabase/migrations/`. Run new migrations in the Supabase SQL Editor when deploying updates.

## Running Tests

```bash
npm test          # Run all tests
npm run build     # Build and type-check
```

## Common Tasks

### Adding a new season setting

1. Add column to `supabase/schema.sql`
2. Update types in `src/types/database.ts`
3. Update validation in `src/lib/seasons/validation.ts`
4. Update settings page `src/app/dashboard/seasons/[id]/settings/page.tsx`
5. Update season creation page `src/app/dashboard/seasons/new/page.tsx`

### Modifying schedule generation

The algorithm is in `src/lib/scheduling/generateSchedule.ts`. Key concepts:
- `ScheduleState` tracks partnerships, games played, byes
- `attemptGeneration()` tries to build a valid schedule
- Two-phase approach: strict first, then relaxed (allows repeat partnerships)
- Tests in `generateSchedule.test.ts` cover all player/court combinations

## Future Work

See `docs/PLAN-byes-per-player.md` for planned enhancement to specify byes per player instead of rounds.
