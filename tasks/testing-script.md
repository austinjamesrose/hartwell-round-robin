# Hartwell Round Robin - Manual Testing Script

Use this script with Claude in Chrome to systematically test all functionality.

**Prerequisites:**
- [ ] Supabase project created with schema applied
- [ ] `.env.local` configured with credentials
- [ ] App running locally (`npm run dev`)

---

## Phase 1: Authentication (US-001)

### Test 1.1: Registration
```
Navigate to: http://localhost:3000/register
```
- [ ] Registration form displays with email and password fields
- [ ] Enter: `test@example.com` / `TestPassword123!`
- [ ] Click Register
- [ ] **Expected:** Redirect to dashboard OR email confirmation message
- [ ] If email confirmation disabled: should land on `/dashboard`

### Test 1.2: Logout
```
On dashboard, find and click Logout button
```
- [ ] **Expected:** Redirect to `/login`

### Test 1.3: Login
```
Navigate to: http://localhost:3000/login
```
- [ ] Enter same credentials from registration
- [ ] Click Login
- [ ] **Expected:** Redirect to `/dashboard`

### Test 1.4: Session Persistence
```
Refresh the browser (Cmd+R / F5)
```
- [ ] **Expected:** Still on dashboard, still logged in

### Test 1.5: Protected Routes
```
Open new incognito window
Navigate to: http://localhost:3000/dashboard
```
- [ ] **Expected:** Redirect to `/login`

---

## Phase 2: Season Management (US-002, US-003)

### Test 2.1: Create Season
```
On dashboard, click "Create New Season" or similar button
```
- [ ] Form displays with: Name, Start Date, Weeks, Courts
- [ ] Enter:
  - Name: `Spring 2026 League`
  - Start Date: Pick next Saturday
  - Weeks: `7` (default)
  - Courts: `6` (default)
- [ ] Click Create/Submit
- [ ] **Expected:** Redirect to season detail page
- [ ] **Expected:** 7 weeks visible with dates calculated

### Test 2.2: Dashboard Shows Season
```
Navigate to: /dashboard
```
- [ ] Season "Spring 2026 League" appears in list
- [ ] Shows: name, start date, status (active), current week
- [ ] Click on the season card
- [ ] **Expected:** Navigate to season detail

### Test 2.3: Validation
```
Try creating another season with same name
```
- [ ] **Expected:** Error - duplicate name not allowed

---

## Phase 3: Roster Management (US-004, US-005, US-005b)

### Test 3.1: Add Players
```
On season detail page, find roster section
```
- [ ] "Create & Add" or "Add Player" form visible
- [ ] Enter player name: `Alice Anderson`
- [ ] Click Add
- [ ] **Expected:** Player appears in roster list
- [ ] Repeat for 27 more players (28 total for testing):
  ```
  Bob Baker, Carol Chen, David Davis, Emma Evans, Frank Foster,
  Grace Garcia, Henry Hill, Iris Irving, Jack Johnson, Kate King,
  Leo Lopez, Maria Martinez, Noah Nelson, Olivia Ortiz, Paul Park,
  Quinn Quinn, Rosa Rodriguez, Sam Smith, Tina Taylor, Uma Upton,
  Victor Vega, Wendy Wang, Xavier Xie, Yuki Yamamoto, Zoe Zhang,
  Adam Adams, Beth Brown
  ```
- [ ] **Expected:** Roster shows "28 players"

### Test 3.2: Duplicate Prevention
```
Try adding "Alice Anderson" again
```
- [ ] **Expected:** Error or prevention message

### Test 3.3: Player Removal (before games)
```
Find any player row, click Remove
```
- [ ] **Expected:** Player removed from roster
- [ ] Add them back for testing

### Test 3.4: Global Player Pool
```
Navigate to: /dashboard/players (or find "Manage Players" link)
```
- [ ] All 28 players listed
- [ ] Each shows which season(s) they belong to
- [ ] Click edit on one player, rename to `Alice A. Anderson`
- [ ] **Expected:** Name updates
- [ ] Go back to season roster
- [ ] **Expected:** Name updated there too

---

## Phase 4: Availability (US-007)

### Test 4.1: Week Navigation
```
On season detail, click on Week 1 (or "Manage Week")
```
- [ ] Week management page loads
- [ ] Shows week number, date, status (draft)
- [ ] Can navigate between weeks (tabs or arrows)

### Test 4.2: Mark Availability
```
On Week 1 management page
```
- [ ] All 28 players listed with availability toggles
- [ ] Default: all available (28 available)
- [ ] Toggle OFF 4 players
- [ ] **Expected:** Count shows "24 available"
- [ ] **Expected:** No warning (24 is valid)

### Test 4.3: Invalid Count Warning
```
Toggle OFF 2 more players (22 available)
```
- [ ] **Expected:** Warning indicator (red/yellow) - below 24 minimum

```
Toggle back ON to get 28 available
```
- [ ] **Expected:** Warning clears

---

## Phase 5: Schedule Generation (US-008a, US-008b, US-008c)

### Test 5.1: Generate Button State
```
With 28 players available on Week 1
```
- [ ] "Generate Schedule" button is enabled
- [ ] Click Generate
- [ ] **Expected:** Loading indicator appears
- [ ] **Expected:** Schedule appears within 10 seconds

### Test 5.2: Verify Schedule Structure
```
Review generated schedule
```
- [ ] Shows multiple rounds (should be ~10 for 28 players, 6 courts)
- [ ] Each round shows 6 courts with 4 players each
- [ ] Each round shows 4 players on bye
- [ ] Summary shows: 8 games per player

### Test 5.3: Games Per Player Check
```
Find "Games per player" summary or breakdown
```
- [ ] **Expected:** All players show exactly 8 games
- [ ] No players highlighted as violations

### Test 5.4: Save Schedule
```
Click Save or confirm button
```
- [ ] **Expected:** Schedule saved
- [ ] **Expected:** Status still "draft"

---

## Phase 6: Manual Adjustments (US-010)

### Test 6.1: Player Swap
```
On draft schedule, click on a player in Round 1
```
- [ ] **Expected:** Player highlighted/selected
- [ ] Click on a different player in same round (different court or bye)
- [ ] **Expected:** Players swap positions
- [ ] **Expected:** Swap reflected immediately in UI

### Test 6.2: Constraint Warning After Swap
```
If swap creates a repeat partnership
```
- [ ] **Expected:** Warning message appears
- [ ] Swap back or make valid swap

### Test 6.3: Save Changes
```
After making swap(s), click Save
```
- [ ] **Expected:** Changes persist after page refresh

---

## Phase 7: Finalize & Unfinalize (US-011, US-011b)

### Test 7.1: Finalize Schedule
```
On draft schedule with no unsaved changes
```
- [ ] "Finalize" button visible
- [ ] Click Finalize
- [ ] **Expected:** Confirmation dialog appears
- [ ] Confirm
- [ ] **Expected:** Status changes to "finalized"
- [ ] **Expected:** Swap/edit controls disabled

### Test 7.2: Unfinalize (before scores)
```
On finalized schedule with no scores entered
```
- [ ] "Unfinalize" button visible
- [ ] Click Unfinalize
- [ ] Confirm
- [ ] **Expected:** Status reverts to "draft"
- [ ] **Expected:** Swap controls work again

### Test 7.3: Re-finalize
```
Finalize the schedule again for score entry testing
```
- [ ] Status is "finalized"

---

## Phase 8: Score Entry (US-012a, US-012b) - TEST ON MOBILE

### Test 8.1: Score Entry UI
```
On finalized week, find score entry section
Open on mobile phone or use Chrome DevTools mobile view
```
- [ ] Games listed by round
- [ ] Each game shows: court, 4 player names, score inputs
- [ ] Team 1 and Team 2 visually distinct
- [ ] Touch targets are large (44px+)
- [ ] Tapping input shows numeric keyboard (mobile)

### Test 8.2: Valid Score Entry
```
Enter score for first game: Team 1 = 11, Team 2 = 7
```
- [ ] Click Save/Submit
- [ ] **Expected:** Score saves successfully
- [ ] **Expected:** Game marked as completed

### Test 8.3: Invalid Score - Both 11
```
Enter score for second game: Team 1 = 11, Team 2 = 11
```
- [ ] **Expected:** Validation error
- [ ] **Expected:** Clear error message (only one team can score 11)

### Test 8.4: Invalid Score - Neither 11
```
Enter score: Team 1 = 9, Team 2 = 7
```
- [ ] **Expected:** Validation error
- [ ] **Expected:** Message indicating one team must score 11

### Test 8.5: Edge Cases
```
Enter valid scores:
- 11-0 (shutout) - should work
- 0-11 (shutout) - should work
- 11-10 (close game) - should work
- 10-11 (close game) - should work
```
- [ ] All save successfully

---

## Phase 9: Edit Scores (US-013)

### Test 9.1: Edit Existing Score
```
Find a completed game with score
```
- [ ] Edit button/option visible
- [ ] Click Edit
- [ ] **Expected:** Score inputs become editable
- [ ] Change score from 11-7 to 11-9
- [ ] Save
- [ ] **Expected:** New score displays

---

## Phase 10: Mark Week Complete (US-014)

### Test 10.1: Incomplete Week Warning
```
With some games missing scores, look for "Mark Complete" button
```
- [ ] Button visible
- [ ] Click it
- [ ] **Expected:** Warning about missing scores

### Test 10.2: Complete All Scores
```
Enter scores for ALL remaining games in Week 1
```
- [ ] All games show as completed

### Test 10.3: Mark Complete
```
Click "Mark Complete"
```
- [ ] **Expected:** Week status changes to "completed"

### Test 10.4: Unfinalize Blocked
```
Try to unfinalize the completed week
```
- [ ] **Expected:** Unfinalize blocked or hidden (scores exist)

---

## Phase 11: Leaderboard (US-015)

### Test 11.1: View Standings
```
Navigate to season standings/leaderboard
```
- [ ] Table displays with columns: Rank, Player, Points, Games, Wins, Win %
- [ ] Players sorted by Total Points (descending)
- [ ] Points match entered scores

### Test 11.2: Tie Handling
```
If two players have same points
```
- [ ] **Expected:** Same rank with "T" prefix (e.g., T3, T3)
- [ ] Secondary sort by Win %

---

## Phase 12: Player Detail (US-016)

### Test 12.1: View Player History
```
Click on any player name in leaderboard
```
- [ ] Player detail page loads
- [ ] Shows: total points, games played, wins, win %
- [ ] Game history table shows each game:
  - Week number
  - Partner name
  - Opponent names
  - Score
  - W/L indicator
- [ ] Sorted most recent first

---

## Phase 13: Historical Weeks (US-017)

### Test 13.1: View Completed Week
```
Navigate to Week 1 (now completed)
```
- [ ] Full schedule displays with scores shown
- [ ] "Completed" status clearly indicated
- [ ] Read-only (no edit controls)

---

## Phase 14: PDF Export (US-018, US-019)

### Test 14.1: Schedule PDF
```
On any week with schedule, find "Export PDF" button
```
- [ ] Click Export PDF
- [ ] **Expected:** PDF downloads
- [ ] Open PDF:
  - [ ] Season name visible
  - [ ] Week number and date visible
  - [ ] Round-by-round layout
  - [ ] Court assignments clear
  - [ ] Bye players listed
  - [ ] Formatted for printing

### Test 14.2: Standings PDF
```
On leaderboard, find "Export PDF" button
```
- [ ] Click Export PDF
- [ ] **Expected:** PDF downloads
- [ ] Open PDF:
  - [ ] Season name visible
  - [ ] "Standings as of [date]"
  - [ ] Table with Rank, Player, Points, Games, Wins, Win %
  - [ ] Timestamp in footer

---

## Summary Checklist

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Authentication | [ ] |
| 2 | Season Management | [ ] |
| 3 | Roster Management | [ ] |
| 4 | Availability | [ ] |
| 5 | Schedule Generation | [ ] |
| 6 | Manual Adjustments | [ ] |
| 7 | Finalize/Unfinalize | [ ] |
| 8 | Score Entry | [ ] |
| 9 | Edit Scores | [ ] |
| 10 | Mark Complete | [ ] |
| 11 | Leaderboard | [ ] |
| 12 | Player Detail | [ ] |
| 13 | Historical Weeks | [ ] |
| 14 | PDF Export | [ ] |

---

## Notes / Issues Found

```
Record any bugs or issues here during testing:

1.
2.
3.
```
