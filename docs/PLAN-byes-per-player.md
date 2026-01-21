# Plan: Byes Per Player Setting

## Summary

Replace `rounds_per_week` with `byes_per_player` as the season-level schedule configuration. This is more intuitive for admins who think in terms of "everyone gets 1 bye" rather than "we need 7 rounds."

**Key behavior:** Rounds are calculated dynamically based on actual available players each week. If 26 players show up one week and 30 the next, the system automatically adjusts rounds to maintain the desired byes per player.

## Current State

- `seasons.rounds_per_week INTEGER DEFAULT NULL` (1-20 when set)
- Schedule generator accepts `targetRounds` parameter
- Fixed rounds = fixed games per player (may vary from 8)

## Proposed Changes

### 1. Database Schema

**File:** `supabase/schema.sql`

```sql
-- Replace rounds_per_week with byes_per_player
ALTER TABLE seasons DROP COLUMN rounds_per_week;
ALTER TABLE seasons ADD COLUMN byes_per_player INTEGER DEFAULT NULL
  CHECK (byes_per_player IS NULL OR (byes_per_player >= 0 AND byes_per_player <= 5));
```

- `null` = auto-calculate for 8 games per player (current default behavior)
- `0` = no byes (only works when players = courts × 4)
- `1-5` = fixed byes per player

**Migration:** Create a Supabase migration to convert existing `rounds_per_week` values:
```sql
-- For existing seasons with rounds_per_week set, we can't perfectly convert
-- since byes depend on player count. Set to null and let admins reconfigure.
UPDATE seasons SET byes_per_player = NULL WHERE rounds_per_week IS NOT NULL;
```

### 2. TypeScript Types

**File:** `src/types/database.ts`

```typescript
// In seasons Row/Insert/Update types:
- rounds_per_week: number | null;
+ byes_per_player: number | null;
```

### 3. Season Validation

**File:** `src/lib/seasons/validation.ts`

```typescript
// Replace roundsPerWeek with byesPerPlayer
byesPerPlayer: z
  .number()
  .int("Byes per player must be a whole number")
  .min(0, "Cannot have negative byes")
  .max(5, "Cannot have more than 5 byes per player")
  .nullable()
  .optional(),
```

Update defaults:
```typescript
export const createSeasonDefaults: CreateSeasonFormValues = {
  // ...
  byesPerPlayer: null,
};
```

### 4. Schedule Generation Algorithm

**File:** `src/lib/scheduling/generateSchedule.ts`

Add helper function to calculate rounds from byes:

```typescript
/**
 * Calculate rounds needed for a target number of byes per player
 *
 * @param numPlayers - Number of available players
 * @param numCourts - Number of courts
 * @param byesPerPlayer - Target byes per player
 * @returns Number of rounds needed
 */
export function calculateRoundsFromByes(
  numPlayers: number,
  numCourts: number,
  byesPerPlayer: number
): number {
  const playersPerRound = numCourts * 4;
  const byesPerRound = Math.max(0, numPlayers - playersPerRound);

  if (byesPerRound === 0) {
    // Perfect fit - no byes possible, return default rounds for 8 games
    return Math.ceil((numPlayers * 8) / playersPerRound);
  }

  // Total byes needed = players × byes per player
  // Rounds = total byes / byes per round
  const totalByesNeeded = numPlayers * byesPerPlayer;
  return Math.ceil(totalByesNeeded / byesPerRound);
}
```

Update `generateSchedule()` signature:

```typescript
export function generateSchedule(
  playerIds: string[],
  numCourts: number,
  options?: {
    targetRounds?: number;      // Direct rounds override (for backwards compat)
    byesPerPlayer?: number;     // Calculate rounds from byes
  }
): Schedule {
  let targetRounds: number | undefined;

  if (options?.targetRounds !== undefined) {
    targetRounds = options.targetRounds;
  } else if (options?.byesPerPlayer !== undefined) {
    targetRounds = calculateRoundsFromByes(
      playerIds.length,
      numCourts,
      options.byesPerPlayer
    );
  }

  // ... rest of function uses targetRounds
}
```

### 5. Schedule Generator Component

**File:** `src/app/dashboard/seasons/[id]/weeks/[weekId]/schedule-generator.tsx`

Update props:

```typescript
interface ScheduleGeneratorProps {
  // ...
  byesPerPlayer?: number | null;  // Replace roundsPerWeek
}
```

Update description to show byes info:

```typescript
{byesPerPlayer !== null && byesPerPlayer !== undefined ? (
  <span className="block mt-1 text-xs">
    Target: {byesPerPlayer} bye{byesPerPlayer !== 1 ? 's' : ''} per player
    ({calculatedRounds} rounds for {playerCount} players)
  </span>
) : (
  <span className="block mt-1 text-xs">
    Auto: 8 games per player
  </span>
)}
```

### 6. Week Page

**File:** `src/app/dashboard/seasons/[id]/weeks/[weekId]/page.tsx`

```typescript
<ScheduleGenerator
  // ...
  byesPerPlayer={season.byes_per_player}
/>
```

### 7. Season Creation UI

**File:** `src/app/dashboard/seasons/new/page.tsx`

Replace rounds field with byes field:

```tsx
<FormField
  control={form.control}
  name="byesPerPlayer"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Byes Per Player (Optional)</FormLabel>
      <FormControl>
        <Input
          type="number"
          min={0}
          max={5}
          placeholder="Auto (8 games/player)"
          value={field.value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            field.onChange(val === "" ? null : parseInt(val) || null);
          }}
        />
      </FormControl>
      <FormDescription>
        Leave blank for 8 games per player. Set to 1 for one bye per player
        (rounds calculated based on available players each week).
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 8. Season Settings Page

**File:** `src/app/dashboard/seasons/[id]/settings/page.tsx`

Replace rounds field with byes field (similar to creation UI).

Add preview calculation:

```tsx
// Show preview of what this means
{byesPerPlayer !== "" && (
  <p className="text-sm text-muted-foreground mt-2">
    With {rosterCount} players: ~{calculateRoundsFromByes(rosterCount, season.num_courts, parseInt(byesPerPlayer))} rounds
  </p>
)}
```

### 9. Tests

**File:** `src/lib/scheduling/generateSchedule.test.ts`

Add tests for `calculateRoundsFromByes()`:

```typescript
describe("calculateRoundsFromByes", () => {
  it("calculates 7 rounds for 28 players, 6 courts, 1 bye", () => {
    // 28 players, 24 play per round, 4 byes per round
    // 28 total byes needed / 4 per round = 7 rounds
    expect(calculateRoundsFromByes(28, 6, 1)).toBe(7);
  });

  it("calculates 14 rounds for 28 players, 6 courts, 2 byes", () => {
    // 56 total byes needed / 4 per round = 14 rounds
    expect(calculateRoundsFromByes(28, 6, 2)).toBe(14);
  });

  it("handles perfect fit (no byes possible)", () => {
    // 24 players on 6 courts = 24 play, 0 byes per round
    // Falls back to 8 games per player calculation
    expect(calculateRoundsFromByes(24, 6, 1)).toBe(8);
  });
});

describe("generateSchedule with byesPerPlayer", () => {
  it("generates correct rounds for 1 bye per player", () => {
    const playerIds = generatePlayerIds(28);
    const schedule = generateSchedule(playerIds, 6, { byesPerPlayer: 1 });

    expect(schedule.rounds.length).toBe(7);

    // Verify each player has ~1 bye
    const byeCounts = new Map<string, number>();
    for (const round of schedule.rounds) {
      for (const playerId of round.byes) {
        byeCounts.set(playerId, (byeCounts.get(playerId) || 0) + 1);
      }
    }

    for (const playerId of playerIds) {
      const byes = byeCounts.get(playerId) || 0;
      expect(byes).toBeGreaterThanOrEqual(0);
      expect(byes).toBeLessThanOrEqual(2); // Allow small variance
    }
  });
});
```

## Verification Steps

1. Run `npm test` - all tests pass
2. Create a new season with 1 bye per player configured
3. Add 28 players to roster
4. Mark all as available for a week
5. Generate schedule
6. Verify:
   - Exactly 7 rounds generated
   - Each player has 1 bye (or close to it)
   - ~6 games per player
7. Change availability to 26 players
8. Regenerate schedule
9. Verify rounds adjusted (26 players / 2 byes per round = 13 rounds for 1 bye each... wait that's not right)

Actually let me recalculate for 26 players:
- 26 players, 6 courts, 24 play per round
- 2 byes per round
- For 1 bye per player: 26 total byes / 2 per round = 13 rounds

That's a lot more rounds! This is actually the correct dynamic behavior - fewer byes per round means more rounds needed.

## Edge Cases to Handle

### Player Count Impact Analysis (6 courts, 1 bye per player target)

| Players | Byes/Round | Rounds for 1 Bye Each | Games/Player | Notes |
|---------|------------|----------------------|--------------|-------|
| 24 | 0 | **N/A** | 8 | Perfect fit - no byes possible |
| 26 | 2 | 13 | ~12 | Many rounds, many games |
| 28 | 4 | 7 | ~6 | Sweet spot |
| 30 | 6 | 5 | ~4 | Few rounds, few games |
| 32 | 8 | 4 | ~3 | Very few games |

**Key insight:** More players = fewer rounds needed for same byes, but also fewer games per player.

### Detailed Edge Cases

1. **Perfect fit (24 players on 6 courts):**
   - 0 byes per round - everyone plays every round
   - **Impossible to give anyone a bye**
   - System should warn: "With 24 players on 6 courts, all players fit every round. Byes are not possible."
   - Options for admin:
     - Fall back to auto mode (8 games per player)
     - Mark 1+ players unavailable to create byes

2. **Near-perfect fit (26 players on 6 courts):**
   - Only 2 byes per round
   - 1 bye per player requires **13 rounds** (~12 games each)
   - System should warn: "With 26 players, 1 bye per player requires 13 rounds. Consider marking more players unavailable or using auto mode."

3. **High player count (30+ players):**
   - 30 players: 6 byes/round → 5 rounds for 1 bye each → only ~4 games per player
   - 32 players: 8 byes/round → 4 rounds for 1 bye each → only ~3 games per player
   - System should warn: "With 30 players, 1 bye per player results in only 4 games each. Consider increasing byes or using auto mode."

4. **Zero byes requested but not perfect fit:**
   - Admin sets `byes_per_player = 0` but has 28 players
   - Byes are unavoidable (4 per round)
   - System should warn: "With 28 players on 6 courts, 4 players must sit out each round. 0 byes per player is not possible."

### Recommended UI Warnings

Add dynamic warnings in the Settings page based on roster count:

```typescript
function getByesWarning(
  numPlayers: number,
  numCourts: number,
  byesPerPlayer: number
): string | null {
  const playersPerRound = numCourts * 4;
  const byesPerRound = numPlayers - playersPerRound;

  // Perfect fit - no byes possible
  if (byesPerRound <= 0 && byesPerPlayer > 0) {
    return `With ${numPlayers} players on ${numCourts} courts, all players fit every round. Byes are not possible.`;
  }

  // Calculate what this config produces
  const rounds = calculateRoundsFromByes(numPlayers, numCourts, byesPerPlayer);
  const gamesPerPlayer = Math.floor((rounds * playersPerRound) / numPlayers);

  // Warn if too many rounds
  if (rounds > 12) {
    return `This configuration requires ${rounds} rounds. Consider using auto mode or adjusting player availability.`;
  }

  // Warn if too few games
  if (gamesPerPlayer < 5) {
    return `This configuration results in only ~${gamesPerPlayer} games per player. Consider reducing byes or using auto mode.`;
  }

  return null;
}
```

## Migration Path

Since this changes the database schema, need a migration strategy:

1. Add `byes_per_player` column (nullable)
2. Keep `rounds_per_week` temporarily for backwards compatibility
3. Update UI to use new field
4. Migrate any existing `rounds_per_week` values (set to null, let admin reconfigure)
5. Remove `rounds_per_week` column in future release

Alternatively, could support both fields with `byes_per_player` taking precedence when set.
