# Hartwell Round Robin

A web application for managing pickleball round robin leagues. Handles player rosters, automatic schedule generation, score tracking, and leaderboards.

## Features

- **Season Management** - Create seasons with configurable weeks and courts
- **Player Pool** - Maintain a master list of players, add them to any season
- **Smart Scheduling** - Automatically generates balanced schedules where each player plays 8 games with varied partners
- **Availability Tracking** - Mark players available/unavailable each week
- **Score Entry** - Record game scores with validation (standard pickleball rules)
- **Leaderboards** - Rankings by total points with win percentage tiebreaker
- **PDF Export** - Print schedules, score sheets, and standings

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Set up the database:
   - Run the SQL in `supabase/schema.sql` in your Supabase SQL editor

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Documentation

- **[User Guide](docs/USER_GUIDE.md)** - How to use the application
- **[CLAUDE.md](CLAUDE.md)** - Technical documentation for developers

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm test          # Run tests
npm run lint      # Run ESLint
```
