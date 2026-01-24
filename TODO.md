# Hartwell Round Robin - Code Review TODO

Staff Engineer code review findings — January 24, 2026

## 🟡 Major Issues (Should Fix)

- [x] **1. Environment variable validation** — Replace `!` non-null assertions with proper validation
  - Files: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
  - Throw descriptive errors if env vars are missing
  - ✅ Created `src/lib/env.ts` with `getSupabaseEnv()` helper

- [x] **2. Structured logging for production** — Replace `console.error` with structured logging
  - Files: `src/app/dashboard/page.tsx`, `src/app/dashboard/players/page.tsx`, `src/lib/players/validation.ts`, `src/lib/seasons/validation.ts`
  - Consider Pino, Winston, or error monitoring (Sentry)
  - ✅ Created `src/lib/logger.ts` with structured logging utility

- [x] **3. Batch database updates in swap save** — Use `Promise.all` instead of sequential updates
  - File: `src/app/dashboard/seasons/[id]/weeks/[weekId]/schedule-viewer.tsx:329-354`
  - Or implement a Supabase RPC function for batch updates
  - ✅ Refactored to use `Promise.all` with graceful partial failure handling

- [x] **4. Input sanitization on player names** — Add defense-in-depth sanitization
  - File: `src/lib/players/validation.ts`
  - Strip HTML, control characters, etc.
  - ✅ Added `sanitizePlayerName()` function, integrated into validation schema

## 🔵 Minor Issues (Nice to Fix)

- [ ] **5. Standardize error handling** — Use toasts for transient notifications, inline alerts for validation
- [ ] **6. Replace magic number** — Use `DEFAULT_GAMES_PER_PLAYER` instead of `8` on line 460 of `generateSchedule.ts`
- [ ] **7. Fix type assertion bypass** — `as unknown as T` pattern in `src/app/dashboard/page.tsx:81`
- [ ] **8. PDF filename edge case** — Handle non-ASCII season names gracefully
- [ ] **9. Add Suspense loading states** — Add meaningful loading UI for server components
- [ ] **10. Fix test HTML warning** — Address hydration warning in `src/app/layout.test.tsx`

---

## Progress Log

### 2026-01-24
- Created TODO from Staff Engineer code review
- ✅ Fixed all 4 major issues:
  1. Env validation: Created `src/lib/env.ts` with `getSupabaseEnv()` that validates at startup with descriptive errors
  2. Structured logging: Created `src/lib/logger.ts` with component-scoped loggers and JSON output for production
  3. Batch updates: Refactored `handleSaveChanges()` to use `Promise.all` with partial failure handling
  4. Input sanitization: Added `sanitizePlayerName()` that strips HTML, control chars, and normalizes whitespace
- All 556 tests passing
