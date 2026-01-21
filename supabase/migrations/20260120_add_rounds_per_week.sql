-- Migration: Add rounds_per_week column to seasons table
-- Date: 2026-01-20
-- Description: Allows specifying a fixed number of rounds per week instead of auto-calculating for 8 games per player

ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS rounds_per_week INTEGER DEFAULT NULL
CHECK (rounds_per_week IS NULL OR (rounds_per_week >= 1 AND rounds_per_week <= 20));

-- Note: IF NOT EXISTS makes this safe to run multiple times (PostgreSQL 9.6+)
