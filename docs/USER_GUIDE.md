# Hartwell Round Robin - User Guide

Welcome to the Hartwell Round Robin league management app! This guide walks you through managing your pickleball round robin league.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a Season](#creating-a-season)
3. [Managing Your Player Pool](#managing-your-player-pool)
4. [Building Your Season Roster](#building-your-season-roster)
5. [Weekly Schedule Management](#weekly-schedule-management)
6. [Entering Scores](#entering-scores)
7. [Viewing the Leaderboard](#viewing-the-leaderboard)
8. [Exporting PDFs](#exporting-pdfs)
9. [Quick Reference](#quick-reference)

---

## Getting Started

### Creating Your Account

1. Visit the site and click **Register**
2. Enter your email address and create a password:
   - At least 8 characters
   - Must include uppercase, lowercase, and a number
3. Check your email for a confirmation link
4. Click the link to verify, then log in

### Forgot Your Password?

1. Click **Forgot Password** on the login page
2. Enter your email address
3. Check your email for a reset link
4. Create a new password

---

## Creating a Season

A "season" represents one round robin league (e.g., "Spring 2026").

### Season Settings

| Setting | Range | Default | Notes |
|---------|-------|---------|-------|
| Season Name | 1-255 characters | — | Must be unique (you can't have two seasons with the same name) |
| Start Date | Any date | — | When Week 1 begins |
| Number of Weeks | 1-12 | 7 | How many weeks the season runs |
| Number of Courts | 4-8 | 6 | Courts available for play |

### To Create a Season:

1. From the Dashboard, click **New Season**
2. Enter the season name, start date, weeks, and courts
3. Click **Create Season**

**Important:** The number of courts determines how many players can play simultaneously. With 6 courts, 24 players play each round (4 players per court × 6 courts).

---

## Managing Your Player Pool

The Player Pool is your master list of all players. Add each player once, then add them to any season's roster.

### Adding Players

**One at a time:**
1. Go to **Players** from the Dashboard
2. Click **Add Player**
3. Enter the player's name and save

**Bulk import (multiple players):**
1. Go to Players → **Bulk Import**
2. Enter names, one per line:
   ```
   John Smith
   Jane Doe
   Bob Wilson
   ```
3. Click **Import**

### Player Name Rules
- Names are trimmed of extra spaces automatically
- Duplicate names are not allowed (case-insensitive: "John Smith" and "john smith" are the same)

---

## Building Your Season Roster

Each season has its own roster of participating players.

### Player Count Requirements

| Requirement | Count | Why |
|-------------|-------|-----|
| **Minimum** | 24 players | Needed for proper round-robin scheduling |
| **Maximum** | 32 players | Prevents excessive byes and scheduling imbalance |
| **Sweet spot** | 27-29 players | Comfortable buffer from the limits |

The app will warn you when you're close to the boundaries (24-26 or 30-32 players).

### Adding Players to a Season

1. Open your season from the Dashboard
2. Click **Roster** in the navigation
3. Use the **+** button to add players from your pool
4. Use the **-** button to remove players

**Note:** You cannot remove a player from a season roster once they have any recorded game scores.

### Searching for Players

Use the search box to quickly find players by name.

---

## Weekly Schedule Management

### How Scheduling Works

The app automatically generates a balanced schedule where:
- **Each player plays exactly 8 games** per week
- **Partnerships are varied** — the system avoids pairing the same two players together twice
- **Byes are distributed evenly** when you have more players than court slots

### Byes Explained

A "bye" means a player sits out that round. Byes happen when you have more players than can fit on the courts.

| Players | Courts | Players per Round | Byes per Round |
|---------|--------|-------------------|----------------|
| 24 | 6 | 24 | 0 |
| 28 | 6 | 24 | 4 |
| 32 | 6 | 24 | 8 |
| 24 | 4 | 16 | 8 |
| 32 | 8 | 32 | 0 |

The system distributes byes evenly so no player sits out significantly more than others.

### Week Status Flow

Each week progresses through three statuses:

```
Draft → Finalized → Completed
```

| Status | What It Means | What You Can Do |
|--------|---------------|-----------------|
| **Draft** | Schedule not yet set | Set availability, generate schedule |
| **Finalized** | Schedule is locked in | Enter scores, view matchups |
| **Completed** | Week is done | View results only |

### Weekly Workflow

**Step 1: Set Availability**
1. Open the week
2. Click **Availability**
3. Mark each player as Available (green) or Unavailable (red)
4. You need 24-32 players marked available to generate a schedule

**Step 2: Generate the Schedule**
1. Click **Generate Schedule**
2. The system creates rounds, assigns courts, and pairs teams
3. Review the schedule
4. Click **Regenerate** if you want a different arrangement
5. Click **Finalize** when satisfied

**Step 3: Play Day**
- Print the schedule and score sheets (see [Exporting PDFs](#exporting-pdfs))
- Record scores during play

**Step 4: Enter Scores**
- After play, enter scores in the app (see [Entering Scores](#entering-scores))
- Mark the week as Completed when done

### Understanding the Schedule View

The schedule shows:
- **Round**: Round 1, Round 2, etc.
- **Court**: Which court (1-8)
- **Teams**: Two doubles teams (Player A & Player B vs Player C & Player D)
- **Byes**: Players sitting out that round

---

## Entering Scores

### Pickleball Scoring Rules

This app uses standard pickleball scoring:
- **Games are played to 11 points**
- **The winning team scores exactly 11**
- **The losing team scores 0-10**

| Valid Scores | Invalid Scores |
|--------------|----------------|
| 11-0, 11-5, 11-10 | 10-8 (no winner) |
| Any 11 vs 0-10 | 11-11 (can't both win) |
| | 12-10 (can't exceed 11) |

### To Enter Scores

1. Open the week (must be **Finalized** status)
2. Click **Score Entry**
3. For each game, enter both team scores
4. Click **Save**

The winning team is highlighted in green after saving.

### Score Entry Rules
- You can only enter scores when the week is finalized
- Both scores must be entered (no partial scores)
- You can edit scores until the week is marked complete

---

## Viewing the Leaderboard

The leaderboard shows cumulative standings across all completed games.

### How Rankings Work

Players are ranked by:
1. **Total Points** (primary) — sum of all points scored across all games
2. **Win Percentage** (tiebreaker) — percentage of games won

If two players tie on both total points AND win percentage, they share the same rank (shown as "T3" for tied at 3rd place).

### Statistics Tracked

| Stat | Meaning |
|------|---------|
| **Total Points** | Sum of your team's scores across all games |
| **Games Played** | Number of completed games |
| **Wins** | Games where your team scored 11 |
| **Win %** | Wins ÷ Games Played × 100 |

**Example:** If you played 8 games, won 6, and your teams scored 11+11+11+11+11+11+8+9 = 83 points total, your stats would be:
- Total Points: 83
- Games Played: 8
- Wins: 6
- Win %: 75%

### Player Detail View

Click any player's name to see their detailed stats:
- Game-by-game results
- Partners they've played with
- Opponents faced

---

## Exporting PDFs

### Schedule PDF
1. Open a week
2. Click the **Export** or printer icon
3. Download and print the schedule showing all rounds and court assignments

### Score Sheets PDF
1. Open a week
2. Click **Export Score Sheets**
3. The PDF is organized by court — each court gets its own section with all games listed
4. Print and hand to court monitors to record scores during play

### Leaderboard PDF
1. Go to the Leaderboard
2. Click **Export PDF**
3. Download current standings

---

## Quick Reference

### Key Numbers

| Item | Value |
|------|-------|
| Players per season | 24-32 |
| Courts per season | 4-8 |
| Weeks per season | 1-12 |
| Games per player per week | 8 |
| Players per court per round | 4 |
| Winning score | 11 |
| Max losing score | 10 |

### Week Status Transitions

| From | To | Requires |
|------|----|----------|
| Draft | Finalized | 24-32 players available, schedule generated |
| Finalized | Completed | (optional: all scores entered) |
| Finalized | Draft | No scores entered yet |

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't generate schedule | Need 24-32 players marked available |
| Can't enter scores | Week must be in Finalized status |
| Can't remove a player | Player has game history — can't remove |
| Can't unfinalize a week | Scores have been entered — can't go back to draft |

---

## Need Help?

If you run into issues, contact Austin!

---

*Last updated: January 2026*
