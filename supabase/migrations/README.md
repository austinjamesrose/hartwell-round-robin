# Database Migrations

This folder contains SQL migrations for the Supabase database. Each migration is a standalone SQL file that can be run in the Supabase SQL Editor.

## How to Use

1. When you need to change the database schema, create a new migration file
2. Name it with the format: `YYYYMMDD_description.sql`
3. Run the migration in the Supabase SQL Editor (Dashboard → SQL Editor)
4. Check the file in git to track what's been applied

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `20260120_add_rounds_per_week.sql` | Add rounds_per_week column to seasons | Applied |

## Initial Schema

The full initial schema is in `../schema.sql`. Use that when setting up a new database from scratch.

## Notes

- Always test migrations on a development database first
- Migrations should be idempotent when possible (safe to run twice)
- Back up data before running destructive migrations
