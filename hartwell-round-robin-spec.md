# Hartwell Round Robin League - Product Specification

## Overview

A mobile-first web application for managing a 7-week pickleball round robin league. The app enables admins to schedule matches, track scores, and maintain leaderboards for a rotating roster of players.

---

## Core Concepts

### League Structure
- **Season Length:** 7 weeks
- **Weekly Players:** 28 players scheduled per week from a larger roster pool
- **Match Format:** Doubles (2v2), but players are tracked as individuals
- **Courts:** 6 courts available per session
- **Games per Player:** 8 games per week, played in rounds

### Roster Management
- Roster contains more players than the 28 weekly slots
- Players mark absences; substitutes fill in
- Substitute players are part of the same roster pool

---

## Scheduling Algorithm Requirements

### Weekly Schedule Generation

**Inputs:**
- 28 available players for the week
- 6 courts (24 players active per round, 4 sitting out)
- 8 games per player target

**Constraints:**

| Priority | Constraint | Type |
|----------|-----------|------|
| 1 | No player paired with the same partner more than once within a single week | Hard |
| 2 | Prefer opponents a player hasn't faced yet this week | Soft |
| 3 | Distribute byes (sit-outs) evenly across all players | Soft |

**Important:** The "no repeat partnership" rule applies only within a single week. Players MAY be partnered again in subsequent weeks.

**Round Structure:**
- Each round: 6 courts × 4 players = 24 players active, 4 players on bye
- Algorithm must determine number of rounds needed to achieve 8 games per player
- Bye distribution should be as even as possible across all 28 players

### Manual Override
- Admin can manually swap players in the generated schedule before finalizing
- Swaps should trigger validation warnings if constraints are violated

---

## Scoring System

### Game Scoring
- Games played to 11 points
- Win by 1 (no win-by-2 requirement)
- Valid final scores: 11-0 through 11-10

### Points Accumulation
- **Every player earns their actual game score** toward their season total
- Winner scores 11 points
- Loser scores whatever they achieved (0-10)
- Example: 11-7 game → Winner gets 11 pts, Loser gets 7 pts

### Leaderboard Ranking
1. **Primary:** Total points accumulated across all games in the season
2. **Tiebreaker:** Win percentage (wins ÷ total games played)

---

## User Roles & Authentication

### Admin
- Authenticated via username/password
- One admin manages a season (but system supports multiple admins for multiple seasons)
- Full CRUD access to their season(s)

### Players/Spectators
- No authentication required
- View-only access to schedules, leaderboards, and history
- Access via shared links

---

## Features

### Admin Panel

#### Season Management
- Create new season
  - Season name
  - Start date
  - Number of weeks (default: 7)
- View/manage multiple seasons
- Archive completed seasons (preserved for historical reference)

#### Roster Management
- Add players (manual entry, one at a time)
- Remove players from roster
- View full roster with status

#### Weekly Management
- Mark player absences for upcoming week
- Generate weekly schedule (algorithm-driven)
- View generated schedule before finalizing
- Make manual swaps to pairings
- Finalize/lock weekly schedule

#### Score Entry
- Enter scores game-by-game
- Input: Both team scores (e.g., Team A: 11, Team B: 7)
- Validation rules:
  - Exactly one team must score 11
  - Losing score must be 0-10
  - Prevent common fat-finger errors
- Edit capability for corrections

#### PDF Export
- Export current standings as PDF
- Export weekly schedule as PDF
- Formatted for mobile viewing and easy distribution

### Public Views (No Auth Required)

#### Current Week Schedule
- Display upcoming/current week only
- Show round-by-round breakdown
- Court assignments
- Player pairings and matchups
- Mobile-optimized layout

#### Leaderboard
- Ranked list of all players
- Display: Rank, Player Name, Total Points, Games Played, Wins, Win %
- Highlight ties appropriately

#### Historical Views
- Browse past weeks
- View completed week schedules
- View results/scores for each game
- Week-by-week standings snapshots

#### Player Detail View
- Individual player statistics
- Game history showing:
  - Week number
  - Partner name
  - Opponent names
  - Score
  - Win/Loss

---

## Data Model

### Season
```
- id (unique identifier)
- name (string)
- start_date (date)
- num_weeks (integer, default: 7)
- status (enum: active, completed, archived)
- admin_id (foreign key)
- created_at (timestamp)
```

### Player
```
- id (unique identifier)
- season_id (foreign key)
- name (string)
- created_at (timestamp)
```

### WeekSchedule
```
- id (unique identifier)
- season_id (foreign key)
- week_number (integer, 1-7)
- date (date)
- status (enum: draft, finalized, completed)
- created_at (timestamp)
```

### PlayerAvailability
```
- id (unique identifier)
- week_schedule_id (foreign key)
- player_id (foreign key)
- is_available (boolean)
```

### Game
```
- id (unique identifier)
- week_schedule_id (foreign key)
- round_number (integer)
- court_number (integer, 1-6)
- team1_player1_id (foreign key)
- team1_player2_id (foreign key)
- team2_player1_id (foreign key)
- team2_player2_id (foreign key)
- team1_score (integer, nullable)
- team2_score (integer, nullable)
- status (enum: scheduled, completed)
```

### Admin
```
- id (unique identifier)
- username (string, unique)
- password_hash (string)
- created_at (timestamp)
```

---

## Technical Architecture

### Hosting
- **Platform:** Vercel (free tier)
- **Approach:** Full-stack deployment (frontend + API)

### Recommended Stack
- **Frontend:** React or Next.js (works well with Vercel)
- **Backend:** Next.js API routes or serverless functions
- **Database:** PostgreSQL via Vercel Postgres, Supabase, or PlanetScale (all have free tiers)
- **Authentication:** NextAuth.js or simple JWT-based auth
- **PDF Generation:** Client-side library (jsPDF, react-pdf) or server-side (puppeteer)

### Design Requirements
- **Mobile-first responsive design**
- Admin must be able to manage entire season from phone
- Clean, readable layouts for outdoor/bright conditions
- Large touch targets for score entry

---

## User Flows

### Admin: Season Setup
1. Log in
2. Create new season (name, start date)
3. Add players to roster one by one
4. Season ready for scheduling

### Admin: Weekly Scheduling
1. Navigate to upcoming week
2. Mark absent players
3. Click "Generate Schedule"
4. Review generated schedule
5. (Optional) Make manual swaps
6. Finalize schedule
7. Export PDF for distribution

### Admin: Score Entry
1. Navigate to current week
2. Select game from schedule
3. Enter both team scores
4. System validates and saves
5. Leaderboard auto-updates
6. Repeat for all games
7. Mark week as complete

### Player: Check Schedule
1. Open shared link (no login)
2. View current week schedule
3. Find their games, courts, partners, opponents

### Player: Check Standings
1. Open leaderboard view
2. See current rankings
3. (Optional) Tap their name for detailed game history

---

## Validation Rules

### Score Entry
- One team must have exactly 11 points
- Other team must have 0-10 points
- Both scores required to save

### Schedule Generation
- Exactly 28 available players required
- Alert if fewer players available
- Warn on constraint violations if manual edits made

### Season Setup
- Season name required
- Start date required
- Cannot create duplicate season names for same admin

---

## PDF Export Specifications

### Weekly Schedule PDF
- Header: Season name, Week number, Date
- Round-by-round layout
- For each game: Court #, Team 1 (Player A & Player B) vs Team 2 (Player C & Player D)
- Bye list per round
- Optimized for letter/A4 printing

### Standings PDF
- Header: Season name, "Standings as of [date]"
- Table: Rank, Player, Total Points, Games, Wins, Win %
- Footer: Generated timestamp

---

## Future Considerations (Out of Scope for V1)

- Player self-service absence marking
- Email/SMS notifications
- Skill-based balancing in scheduling
- Multiple concurrent seasons per admin
- Player accounts with login
- Real-time score updates
- Season statistics and analytics
- Export to CSV/Excel

---

## Success Criteria

1. Admin can create a season and manage roster in under 5 minutes
2. Weekly schedule generation completes in under 10 seconds
3. Schedule respects all hard constraints (no repeat partnerships within week)
4. Score entry for a full week (28 players × 8 games ÷ 4 per game = 56 games) takes under 15 minutes
5. All views render correctly on mobile devices
6. PDF exports are legible and print-ready

---

## Appendix: Algorithm Hints

The weekly scheduling problem is a form of **constrained scheduling**. Approaches to consider:

1. **Round-robin tournament algorithms** - Modified for doubles with partner rotation
2. **Social golfer problem** - Similar constraint of "no repeated groupings"
3. **Constraint satisfaction** - Define constraints and use backtracking search
4. **Greedy with swaps** - Generate initial schedule, then optimize

Key insight: With 28 players playing 8 games each, that's 224 total "player-games." Each game has 4 players, so 224 ÷ 4 = 56 total games per week across all rounds.

---

*Document Version: 1.0*
*Created for: Hartwell Round Robin League*
*Project Codename: Ralph Wiggum*
