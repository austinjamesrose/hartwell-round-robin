# PRD: Hartwell Round Robin League

## 1. Introduction/Overview

A mobile-first web application for managing a 7-week pickleball round robin league. The app enables a single admin to schedule matches, track scores, and maintain leaderboards for a flexible roster of 24-32 weekly players.

**Problem Statement:** Running a round robin league with complex pairing constraints currently requires manual scheduling and score tracking. This is error-prone and time-consuming.

**Solution:** An automated system that generates optimal weekly schedules respecting partnership constraints, tracks scores with mobile-friendly input, and calculates standings automatically.

**Key Constraint:** This is an admin-only tool. All features require authentication. No public/player-facing views.

---

## 2. Goals

- Enable an admin to create and manage a complete 7-week league season
- Automatically generate weekly schedules that satisfy partnership constraints for 24-32 players
- Provide frictionless score entry optimized for mobile use
- Calculate and display leaderboards and game history
- Export schedules and standings as print-ready PDFs

---

## 3. User Stories

### Phase 0: Project Scaffolding

#### US-000: Project Setup
**Description:** As a developer, I want the project scaffolded with all dependencies so that I can begin implementing features.

**Acceptance Criteria:**
- [ ] Next.js 14+ project initialized with App Router
- [ ] Tailwind CSS configured
- [ ] shadcn/ui installed and configured
- [ ] Supabase client configured with environment variables
- [ ] Database schema applied to Supabase (all tables from Technical Considerations)
- [ ] Row Level Security policies applied
- [ ] jsPDF installed as dependency
- [ ] TypeScript strict mode enabled
- [ ] ESLint and Prettier configured
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] Verify in browser: app loads at localhost:3000

---

### Phase 1: Foundation & Auth

#### US-001: Admin Authentication
**Description:** As an admin, I want to log in so that I can manage my league.

**Acceptance Criteria:**
- [ ] Login page with email/password via Supabase Auth
- [ ] Registration flow with email confirmation
- [ ] Redirect to dashboard after successful login
- [ ] Session persists across browser refreshes
- [ ] Logout functionality
- [ ] All other routes redirect to login if unauthenticated
- [ ] Unit tests pass for auth middleware (protected route logic)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: login flow works end-to-end

---

#### US-002: Create Season
**Description:** As an admin, I want to create a new season so that I can begin setting up the league.

**Acceptance Criteria:**
- [ ] Form to enter: season name, start date, number of weeks (default: 7), number of courts (default: 6)
- [ ] Validation: name required, start date required, weeks 1-12, courts 4-8
- [ ] Season is created with status "active"
- [ ] Week schedules auto-created for all weeks (dates calculated from start date)
- [ ] Admin is redirected to the season dashboard
- [ ] Unit tests pass for form validation rules
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: form submits and season appears in list

---

#### US-003: Admin Dashboard
**Description:** As an admin, I want to see an overview of my seasons so that I can navigate to the one I want to manage.

**Acceptance Criteria:**
- [ ] List of all seasons owned by this admin
- [ ] Each season shows: name, start date, status, current week
- [ ] Click season to enter season management view
- [ ] "Create Season" button prominently visible
- [ ] RLS verified: cannot see other admin's seasons
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: dashboard loads with season list

---

### Phase 2: Roster Management

**Note:** Players exist globally (not per-season). The same player can participate in multiple seasons, and their identity persists across seasons.

#### US-004: Add Players to Season Roster
**Description:** As an admin, I want to add players to my season roster so that they can be scheduled for games.

**Acceptance Criteria:**
- [ ] Dropdown/autocomplete to select from existing players in the admin's player pool
- [ ] Option to create a new player (name input) if they don't exist
- [ ] New player names are required, trimmed of whitespace
- [ ] Cannot add same player to a season twice
- [ ] Players appear in season roster immediately after adding
- [ ] Roster displays total player count for this season
- [ ] Unit tests pass for duplicate player prevention logic
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: add existing player, create new player, confirm both appear

---

#### US-005: View and Manage Season Roster
**Description:** As an admin, I want to view the roster for this season and remove players if needed.

**Acceptance Criteria:**
- [ ] Display all players in this season's roster, alphabetically
- [ ] Show total count (e.g., "35 players in this season")
- [ ] Each player row has a "remove from season" button
- [ ] If player has game history in this season, block removal ("Player has 24 games recorded")
- [ ] Removing a player only removes them from this season (not deleted globally)
- [ ] Player names can be edited from a global player management view (not here)
- [ ] Unit tests pass for game history check (blocking removal)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: view roster, remove a player without games

---

#### US-005b: Manage Global Player Pool
**Description:** As an admin, I want to manage my global pool of players across all seasons.

**Acceptance Criteria:**
- [ ] Accessible from dashboard or settings
- [ ] List all players the admin has ever created
- [ ] Show which seasons each player is assigned to
- [ ] Edit player names (applies across all seasons)
- [ ] Players cannot be deleted (to preserve historical data)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: edit a player name, confirm it updates in season rosters

---

### Phase 3: Weekly Scheduling

#### US-006: Select Week to Manage
**Description:** As an admin, I want to navigate between weeks so that I can manage each week's schedule.

**Acceptance Criteria:**
- [ ] Week navigation (tabs, dropdown, or prev/next)
- [ ] Show week number, date, and status (draft/finalized/completed)
- [ ] Current/active week highlighted
- [ ] Can navigate to any week in the season
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: switch between weeks

---

#### US-007: Mark Player Availability
**Description:** As an admin, I want to mark which players are available for a specific week so that scheduling uses the correct players.

**Acceptance Criteria:**
- [ ] View list of all roster players for selected week
- [ ] Toggle availability (checkbox or switch) for each player
- [ ] Default: all players available
- [ ] Show count of available players
- [ ] Visual indicator if count is outside 24-32 range (warning state)
- [ ] Persist availability to database
- [ ] Unit tests pass for availability count validation (24-32 range)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: toggle 5 players unavailable, confirm count updates

---

#### US-008a: Schedule Generation Algorithm
**Description:** As a developer, I want a scheduling algorithm that produces valid weekly schedules so that players are automatically paired for games.

**Acceptance Criteria:**
- [ ] Algorithm generates schedule with exactly 8 games per player (hard constraint)
- [ ] No player is paired with the same partner more than once per week (hard constraint)
- [ ] Opponents varied as much as possible (soft constraint)
- [ ] Byes distributed as evenly as possible across players (soft constraint)
- [ ] Algorithm uses the season's configured court count
- [ ] Schedule generation completes in under 10 seconds
- [ ] Unit tests pass for hard constraint validation (8 games per player)
- [ ] Unit tests pass for partnership constraint (no repeat partners)
- [ ] Unit tests pass for edge cases (24 players minimum, 32 players maximum)
- [ ] Unit tests pass for various court configurations (4, 6, 8 courts)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings

---

#### US-008b: Schedule Generation UI
**Description:** As an admin, I want to trigger schedule generation from the UI so that I can create the weekly matchups.

**Acceptance Criteria:**
- [ ] "Generate Schedule" button visible on week management page
- [ ] Button disabled unless 24-32 players are marked available
- [ ] Disabled state shows tooltip explaining why (e.g., "Need 24-32 available players")
- [ ] Loading indicator while generation runs
- [ ] Generated schedule displayed in round-by-round format
- [ ] Schedule saved with status "draft"
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: generate schedule with 28 players, view all rounds

---

#### US-008c: Schedule Constraint Relaxation
**Description:** As an admin, I want the system to retry with relaxed constraints if strict generation fails so that I always get a usable schedule.

**Acceptance Criteria:**
- [ ] If hard constraints can't be met with initial attempt, retry with relaxed soft constraints
- [ ] Show warnings for any relaxed/violated constraints (e.g., "Some players face the same opponent twice")
- [ ] Return best-effort schedule even if soft constraints are violated
- [ ] Warning messages clearly indicate which constraints were relaxed
- [ ] Warnings persist with schedule and display on schedule view
- [ ] Unit tests pass for constraint relaxation logic
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: with edge case player counts, confirm warnings appear if constraints relaxed

---

#### US-009: View Generated Schedule
**Description:** As an admin, I want to review the generated schedule before finalizing so that I can verify pairings look correct.

**Acceptance Criteria:**
- [ ] Display schedule grouped by round
- [ ] Each round shows: court number, Team 1 players, Team 2 players
- [ ] Show which players have bye each round
- [ ] Show summary: total games, games per player (should all be 8)
- [ ] Highlight any constraint violations (if manual edits created them)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: schedule displays correctly with all rounds visible

---

#### US-010: Manual Schedule Adjustments
**Description:** As an admin, I want to swap players in the generated schedule so that I can accommodate special requests.

**Acceptance Criteria:**
- [ ] Click on a player in a game to select them
- [ ] Click on another player (same round, different game or bye) to swap
- [ ] After swap, re-validate constraints and show warnings if violated
- [ ] Swap is immediately reflected in the UI
- [ ] Can regenerate schedule to reset (loses manual changes)
- [ ] Unit tests pass for swap validation logic
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: swap two players and confirm UI updates

---

#### US-011: Finalize Weekly Schedule
**Description:** As an admin, I want to finalize the schedule so that it's locked and ready for play.

**Acceptance Criteria:**
- [ ] "Finalize" button on draft schedule
- [ ] Confirmation dialog with constraint violation warnings if any
- [ ] Status changes from "draft" to "finalized"
- [ ] Schedule becomes read-only (no more swaps)
- [ ] Score entry becomes available after finalization
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: finalize and confirm status change

---

#### US-011b: Unfinalize Weekly Schedule
**Description:** As an admin, I want to unfinalize a schedule if I made a mistake, so that I can make corrections.

**Acceptance Criteria:**
- [ ] "Unfinalize" button visible on finalized schedules with no scores entered
- [ ] If any scores have been entered, unfinalize is blocked ("Cannot unfinalize - scores already recorded")
- [ ] Status reverts from "finalized" to "draft"
- [ ] Manual adjustments become available again
- [ ] Unit tests pass for unfinalize blocking logic (when scores exist)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: finalize then unfinalize, confirm swaps work again

---

### Phase 4: Score Entry

#### US-012a: Score Entry UI
**Description:** As an admin, I want a mobile-friendly interface for entering scores so that I can quickly record game results.

**Acceptance Criteria:**
- [ ] Score entry view displays games grouped by round
- [ ] Each game shows: court, all 4 players, score inputs
- [ ] Large touch-friendly number inputs (minimum 44x44px touch targets)
- [ ] Inputs optimized for mobile (numeric keyboard)
- [ ] Clear visual distinction between Team 1 and Team 2
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser on mobile: inputs are easy to tap

---

#### US-012b: Score Validation and Saving
**Description:** As an admin, I want score validation so that only valid pickleball scores are recorded.

**Acceptance Criteria:**
- [ ] Score entry only available on finalized schedules (not draft)
- [ ] Validation: exactly one team must score 11
- [ ] Validation: other team must score 0-10
- [ ] Validation: both scores required
- [ ] Clear error messages for invalid scores
- [ ] On valid entry, game status changes to "completed"
- [ ] Points credited to all 4 players (each gets their team's score)
- [ ] Unit tests pass for score validation rules (11-X, X-11 valid; 11-11, 10-10 invalid)
- [ ] Unit tests pass for edge cases (0-11, 11-0, 10-11)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: enter score 11-7 and confirm it saves
- [ ] Verify in browser: enter invalid score 11-11 and confirm error shown

---

#### US-013: Edit Game Scores
**Description:** As an admin, I want to edit a previously entered score so that I can correct mistakes.

**Acceptance Criteria:**
- [ ] Completed games show current score and "Edit" option
- [ ] Editing re-opens the score input fields
- [ ] Same validation rules apply
- [ ] Player point totals recalculated on save
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: edit an existing score and confirm update

---

#### US-014: Mark Week Complete
**Description:** As an admin, I want to mark a week as complete so that it's archived.

**Acceptance Criteria:**
- [ ] "Mark Complete" button visible when week is finalized
- [ ] Warning if any games are missing scores
- [ ] Week status changes to "completed"
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: complete all scores, mark complete, confirm status change

---

### Phase 5: Standings & History

#### US-015: View Leaderboard
**Description:** As an admin, I want to view the current standings so that I can see player rankings.

**Acceptance Criteria:**
- [ ] Leaderboard page/section within season view
- [ ] Table columns: Rank, Player Name, Total Points, Games Played, Wins, Win %
- [ ] Sorted by Total Points (primary), Win % (tiebreaker)
- [ ] Tied players show same rank with "T" prefix (e.g., "T3")
- [ ] Mobile-optimized, readable table
- [ ] Unit tests pass for ranking logic (sorting by points, then win %)
- [ ] Unit tests pass for tie detection and "T" prefix display
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: view leaderboard with data from multiple weeks

---

#### US-016: View Player Detail
**Description:** As an admin, I want to see an individual player's game history so that I can review their performance.

**Acceptance Criteria:**
- [ ] Click player name on leaderboard or roster to view detail
- [ ] Shows: total points, games played, wins, win %
- [ ] Game history table: Week, Partner, Opponents, Score, W/L
- [ ] Sorted by most recent first
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: click player name and confirm detail page loads

---

#### US-017: View Historical Week Results
**Description:** As an admin, I want to browse past weeks' schedules and scores so that I can review history.

**Acceptance Criteria:**
- [ ] Navigate to any completed week
- [ ] Show full schedule with scores displayed
- [ ] Clearly indicate completed status
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: navigate to a past week and confirm scores display

---

### Phase 6: PDF Export

#### US-018: Export Weekly Schedule PDF
**Description:** As an admin, I want to export the weekly schedule as a PDF so that I can print and distribute it.

**Acceptance Criteria:**
- [ ] "Export PDF" button on schedule view
- [ ] PDF includes: season name, week number, date
- [ ] Round-by-round layout with court assignments
- [ ] Bye list per round
- [ ] Formatted for letter/A4 printing
- [ ] Generated client-side using jsPDF
- [ ] Integration test: PDF generates without errors
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: download PDF and open it

---

#### US-019: Export Standings PDF
**Description:** As an admin, I want to export current standings as a PDF so that I can share them.

**Acceptance Criteria:**
- [ ] "Export PDF" button on leaderboard
- [ ] PDF includes: season name, "Standings as of [date]"
- [ ] Table: Rank, Player, Total Points, Games, Wins, Win %
- [ ] Generated timestamp in footer
- [ ] Integration test: PDF generates without errors
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Verify in browser: download PDF and open it

---

## 4. Functional Requirements

### Authentication & Authorization
- FR-1: All routes except login/register must require authentication
- FR-2: Admins can only access seasons they created
- FR-3: Session must persist across page refreshes

### Season Management
- FR-4: The system must support creating seasons with name, start date, week count, and court count
- FR-5: The system must prevent duplicate season names for the same admin
- FR-6: The system must track season status (active, completed, archived)
- FR-6b: Season details (name, start date, courts) are always editable

### Player & Roster Management
- FR-7: Players exist globally (not per-season) and are owned by the admin
- FR-8: The system must allow adding existing players or creating new players when building a season roster
- FR-9: The system must prevent duplicate player names within an admin's player pool
- FR-10: The system must prevent adding the same player to a season twice
- FR-11: The system must block removing players from a season if they have game history in that season
- FR-12: Players cannot be deleted (to preserve historical data across seasons)
- FR-13: Player names can be edited globally (changes apply across all seasons)

### Availability & Scheduling
- FR-14: The system must allow marking player availability per week
- FR-15: The system must support 24-32 available players for schedule generation
- FR-16: The system must use the season's configured court count for scheduling
- FR-17: The system must generate schedules where no player partners with the same person twice in a week (hard constraint)
- FR-18: The system must generate schedules with exactly 8 games per player (hard constraint)
- FR-19: The system must distribute byes as evenly as possible across players (soft constraint)
- FR-20: The system must retry with relaxed soft constraints if initial generation fails
- FR-21: The system must allow manual player swaps in draft schedules
- FR-22: The system must validate and warn on constraint violations after manual edits
- FR-23: The system must support finalizing schedules (locking from edits)
- FR-24: The system must support unfinalizing schedules (only if no scores entered)
- FR-25: The system must determine "current week" as the first incomplete week

### Scoring
- FR-26: Score entry is only allowed on finalized schedules
- FR-27: The system must validate that exactly one team scores 11 points
- FR-28: The system must validate that the losing team scores 0-10 points
- FR-29: The system must credit each player with their team's score toward season total
- FR-30: The system must allow editing previously entered scores
- FR-31: The system must recalculate standings when scores are entered or edited

### Leaderboard
- FR-32: The system must rank players by total points (primary) and win % (tiebreaker)
- FR-33: The system must display tied players at the same rank

### PDF Export
- FR-34: The system must generate schedule PDFs client-side using jsPDF
- FR-35: The system must generate standings PDFs client-side using jsPDF

---

## 5. Non-Goals (Out of Scope for V1)

- Public/player-facing views (admin-only tool)
- Player self-service (marking own absences)
- Email/SMS notifications
- Skill-based or rating-based schedule balancing
- Multiple concurrent active seasons per admin
- Player accounts with authentication
- Real-time live score updates (WebSocket)
- Advanced statistics and analytics
- CSV/Excel export
- Data import from spreadsheets
- Multi-admin collaboration on a single season
- Recurring season templates
- Mobile native app (web only)

---

## 6. Design Considerations

### Mobile-First Requirements
- All views must be fully functional on mobile devices
- Touch targets minimum 44x44px for buttons and inputs
- Score entry inputs must be large and easy to tap
- Layouts must be readable in bright outdoor conditions (high contrast)

### UI Component Library
- **shadcn/ui** - Tailwind-native, accessible components
- Consistent styling via Tailwind CSS design tokens

### Key UI Components
- **Schedule View:** Round-based accordion or card layout
- **Score Entry:** Large number inputs or stepper controls (+/-)
- **Leaderboard:** Responsive table with sticky headers
- **Navigation:** Bottom nav on mobile, sidebar on desktop

### Navigation Structure
```
/ (redirect to /dashboard if logged in, else /login)
/login
/register
/dashboard (season list + create season)
/players (global player pool management)
/season/[id] (season home - current week schedule)
/season/[id]/roster (season roster - add/remove players)
/season/[id]/week/[num] (specific week: availability, schedule, scores)
/season/[id]/standings
/season/[id]/player/[id] (player detail for this season)
```

---

## 7. Technical Considerations

### Stack
- **Framework:** Next.js 14+ (App Router)
- **Hosting:** Vercel (free tier)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS + shadcn/ui
- **PDF:** jsPDF (client-side)
- **Testing:** Vitest for unit tests

### Database Schema

```sql
-- Auth handled by Supabase Auth, we store admin profile
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players are global (not per-season), owned by admin
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, name)  -- Unique name per admin's player pool
);

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  num_weeks INTEGER DEFAULT 7,
  num_courts INTEGER DEFAULT 6,  -- Configurable courts (4-8)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, name)
);

-- Junction table: which players are in which season
CREATE TABLE season_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, player_id)
);

CREATE TABLE week_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, week_number)
);

-- Availability is per-week, references global player
CREATE TABLE player_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_schedule_id UUID REFERENCES week_schedules(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(week_schedule_id, player_id)
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_schedule_id UUID REFERENCES week_schedules(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  court_number INTEGER NOT NULL,
  team1_player1_id UUID REFERENCES players(id) NOT NULL,
  team1_player2_id UUID REFERENCES players(id) NOT NULL,
  team2_player1_id UUID REFERENCES players(id) NOT NULL,
  team2_player2_id UUID REFERENCES players(id) NOT NULL,
  team1_score INTEGER,
  team2_score INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_players_admin ON players(admin_id);
CREATE INDEX idx_seasons_admin ON seasons(admin_id);
CREATE INDEX idx_season_players_season ON season_players(season_id);
CREATE INDEX idx_season_players_player ON season_players(player_id);
CREATE INDEX idx_games_week ON games(week_schedule_id);
CREATE INDEX idx_availability_week ON player_availability(week_schedule_id);
```

### Row Level Security (RLS)
```sql
-- Admins can only see/modify their own seasons
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY seasons_admin_policy ON seasons
  USING (admin_id = auth.uid());

-- Cascade RLS to related tables via season ownership
-- (Similar policies for players, week_schedules, games)
```

### Scheduling Algorithm

**Constraints:**
- 24-32 players (variable)
- C courts (configurable, default 6, range 4-8)
- Players active per round = C × 4
- Exactly 8 games per player (hard constraint)
- No repeated partnerships within a week (hard constraint)
- Opponents varied as much as possible (soft constraint)
- Byes distributed evenly across players (soft constraint)

**Key Math:**
```
Given: N players, C courts
Players per round = C × 4
Byes per round = N - (C × 4)
Total games = (N × 8) / 2  (each game has 2 teams of 2)
Required rounds = (N × 8) / (C × 4)

Example: 28 players, 6 courts
- Players per round = 24
- Byes per round = 4
- Total games = 112
- Required rounds = 28 × 8 / 24 = 9.33 → 10 rounds (some players get 9th game as bye)
```

**Data Structures:**
```typescript
// Track state during generation
type ScheduleState = {
  partnerships: Set<string>;      // "playerA-playerB" sorted, no duplicates allowed
  gamesPlayed: Map<string, number>;  // playerId -> count, target is 8
  byeCount: Map<string, number>;     // playerId -> count, minimize variance
  opponents: Map<string, Set<string>>; // playerId -> set of opponent IDs (soft: vary these)
  rounds: Round[];                 // the schedule being built
}

type Round = {
  games: Game[];
  byes: string[];  // player IDs sitting out
}

type Game = {
  court: number;
  team1: [string, string];  // player IDs
  team2: [string, string];
}
```

**Algorithm: Greedy with Shuffle + Retry**

Rather than pure backtracking (slow), use a greedy approach with randomization:

```
function generateSchedule(playerIds: string[], courts: number): Schedule {
  const numRounds = Math.ceil((playerIds.length * 8) / (courts * 4));

  for (attempt = 0; attempt < 100; attempt++) {
    state = initializeState(playerIds);
    shuffledPlayers = shuffle(playerIds);  // randomize each attempt

    for (round = 0; round < numRounds; round++) {
      // 1. Select players for this round (those needing games, balance byes)
      activePlayers = selectActivePlayers(state, courts * 4);
      byePlayers = playerIds.filter(p => !activePlayers.includes(p));

      // 2. Form teams greedily: pair players who haven't partnered
      teams = formTeams(activePlayers, state.partnerships);
      if (teams === null) continue; // couldn't form valid teams, retry round

      // 3. Match teams into games (vary opponents if possible)
      games = matchTeams(teams, state.opponents, courts);

      // 4. Record round
      state.rounds.push({ games, byes: byePlayers });
      updateState(state, games, byePlayers);
    }

    // Validate: did everyone get exactly 8 games?
    if (validateSchedule(state)) {
      return state.rounds;
    }
  }

  // If 100 attempts fail, return best effort with warnings
  return bestEffortSchedule(state);
}

function formTeams(players: string[], partnerships: Set<string>): Team[] | null {
  // Greedy pairing: sort by games played (ascending), then pair
  // For each player, find a valid partner (not already partnered this week)

  available = [...players];
  teams = [];

  while (available.length >= 2) {
    player1 = available.shift();

    // Find first available partner not already partnered with player1
    partnerIdx = available.findIndex(p =>
      !partnerships.has(partnershipKey(player1, p))
    );

    if (partnerIdx === -1) return null; // no valid partner, need to retry

    player2 = available.splice(partnerIdx, 1)[0];
    teams.push([player1, player2]);
    partnerships.add(partnershipKey(player1, player2));
  }

  return teams;
}

function partnershipKey(a: string, b: string): string {
  return [a, b].sort().join('-');  // consistent ordering
}
```

**Why This Works:**
1. **Greedy + Shuffle** is faster than backtracking for this problem size
2. **100 retries** with different shuffles finds a valid solution quickly
3. **Partnership tracking** prevents repeat partners (hard constraint)
4. **Games played balancing** ensures everyone gets 8 games
5. **Bye count balancing** distributes rest evenly

**Test Cases for Validation:**

| Players | Courts | Expected Rounds | Games/Player | Byes/Round |
|---------|--------|-----------------|--------------|------------|
| 24 | 6 | 8 | 8 | 0 |
| 28 | 6 | 10 | 8 | 4 |
| 32 | 6 | 11 | 8 | 8 |
| 24 | 4 | 12 | 8 | 8 |
| 32 | 8 | 8 | 8 | 0 |

**Edge Cases:**
- **24 players, 6 courts**: Perfect fit, no byes needed
- **25 players, 6 courts**: 1 bye per round, 9-10 rounds
- **32 players, 8 courts**: Perfect fit, no byes needed
- **Odd bye counts**: Some rounds may have different bye counts

**Constraint Relaxation (if algorithm fails):**
1. First: Relax opponent variety (allow repeat opponents)
2. Second: Allow slight imbalance in byes (±1 game)
3. Never relax: partnership constraint (no repeat partners)
4. Never relax: 8 games per player

**File Location:** `src/lib/scheduling/generateSchedule.ts`

### Performance
- Schedule generation: < 10 seconds
- Page loads: < 2 seconds
- Leaderboard queries: optimized with proper indexes

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Season setup time (create + add 35 players) | < 5 minutes |
| Schedule generation time | < 10 seconds |
| Score entry for full week (48-64 games) | < 15 minutes |
| Mobile usability score (Lighthouse) | > 90 |
| Page load time | < 2 seconds |
| Zero hard constraint violations | 100% of generated schedules |

---

## 9. Resolved Decisions

1. **Player model:** Players are global (not per-season). Same player can be in multiple seasons. Players are never deleted.

2. **Courts:** Configurable per season (4-8 courts, default 6).

3. **Player count:** Algorithm supports 24-32 players per week.

4. **Season editing:** Yes, season details (name, dates, courts) are always editable.

5. **Player renaming:** Yes, player names can be edited globally (applies to all seasons).

6. **Removing players from season:** Blocked if they have game history in that season.

7. **Tie display:** Same rank number with "T" prefix (e.g., "T3").

8. **Week dates:** Auto-calculated. Week N date = start_date + 7 × (week_number - 1).

9. **Current week:** Defined as the first week with status != "completed".

10. **Score entry timing:** Only allowed on finalized schedules.

11. **Unfinalize:** Allowed if no scores have been entered yet.

12. **Algorithm failure:**
    - First attempt with all constraints
    - If fails, retry with relaxed soft constraints
    - Show which constraints were relaxed/violated
    - Return best-effort schedule with warnings

13. **Multiple seasons:** Admins can have multiple seasons (past and current).

---

## Appendix: User Story Dependency Map

```
US-000 (Project Setup)
    └── US-001 (Auth)
            ├── US-005b (Global Player Pool) ← Can be done anytime after auth
            └── US-002 (Create Season)
                    └── US-003 (Dashboard)
                            └── US-004 (Add Players to Season)
                                    └── US-005 (Manage Season Roster)
                                            └── US-006 (Select Week)
                                                    └── US-007 (Mark Availability)
                                                            └── US-008a (Schedule Algorithm)
                                                                    └── US-008b (Schedule UI)
                                                                            └── US-008c (Constraint Relaxation)
                                                                                    └── US-009 (View Schedule)
                                                                                            ├── US-010 (Manual Adjustments)
                                                                                            └── US-011 (Finalize)
                                                                                                    ├── US-011b (Unfinalize) ← only if no scores
                                                                                                    ├── US-012a (Score Entry UI)
                                                                                                    │       └── US-012b (Score Validation)
                                                                                                    │               └── US-013 (Edit Scores)
                                                                                                    │                       └── US-014 (Mark Complete)
                                                                                                    ├── US-015 (Leaderboard)
                                                                                                    │       └── US-016 (Player Detail)
                                                                                                    ├── US-017 (Historical Weeks)
                                                                                                    ├── US-018 (Schedule PDF)
                                                                                                    └── US-019 (Standings PDF)
```

**Total: 24 User Stories**

---

*PRD Version: 3.0*
*Created: January 2026*
*Status: Ready for Implementation - All questions resolved*
