-- Hartwell Round Robin League Database Schema
-- This schema defines all tables needed for the pickleball round robin league management app

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Season status: tracks the lifecycle of a season
CREATE TYPE season_status AS ENUM ('active', 'completed', 'archived');

-- Week status: tracks the state of a weekly schedule
CREATE TYPE week_status AS ENUM ('draft', 'finalized', 'completed');

-- Game status: tracks whether a game has been played
CREATE TYPE game_status AS ENUM ('scheduled', 'completed');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Seasons table: stores league seasons owned by admins
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    num_weeks INTEGER NOT NULL DEFAULT 7 CHECK (num_weeks >= 1 AND num_weeks <= 12),
    num_courts INTEGER NOT NULL DEFAULT 6 CHECK (num_courts >= 4 AND num_courts <= 8),
    status season_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table: global player pool owned by admins
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Season-Players junction table: links players to specific seasons
CREATE TABLE season_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_id, player_id)
);

-- Weeks table: stores weekly schedules for each season
CREATE TABLE weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1),
    date DATE NOT NULL,
    status week_status NOT NULL DEFAULT 'draft',
    schedule_warnings TEXT[] DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_id, week_number)
);

-- Player availability table: tracks which players are available each week
CREATE TABLE player_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(week_id, player_id)
);

-- Games table: stores individual game matchups and scores
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number >= 1),
    court_number INTEGER NOT NULL CHECK (court_number >= 1),
    team1_player1_id UUID NOT NULL REFERENCES players(id),
    team1_player2_id UUID NOT NULL REFERENCES players(id),
    team2_player1_id UUID NOT NULL REFERENCES players(id),
    team2_player2_id UUID NOT NULL REFERENCES players(id),
    team1_score INTEGER DEFAULT NULL CHECK (team1_score IS NULL OR (team1_score >= 0 AND team1_score <= 11)),
    team2_score INTEGER DEFAULT NULL CHECK (team2_score IS NULL OR (team2_score >= 0 AND team2_score <= 11)),
    status game_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure exactly one team scores 11 when game is completed
    CONSTRAINT valid_pickleball_score CHECK (
        (team1_score IS NULL AND team2_score IS NULL) OR
        (team1_score = 11 AND team2_score < 11) OR
        (team2_score = 11 AND team1_score < 11)
    )
);

-- Byes table: tracks which players have a bye in each round
CREATE TABLE byes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number >= 1),
    player_id UUID NOT NULL REFERENCES players(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(week_id, round_number, player_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Seasons indexes
CREATE INDEX idx_seasons_admin_id ON seasons(admin_id);

-- Players indexes
CREATE INDEX idx_players_admin_id ON players(admin_id);
CREATE INDEX idx_players_name ON players(name);

-- Season players indexes
CREATE INDEX idx_season_players_season_id ON season_players(season_id);
CREATE INDEX idx_season_players_player_id ON season_players(player_id);

-- Weeks indexes
CREATE INDEX idx_weeks_season_id ON weeks(season_id);

-- Player availability indexes
CREATE INDEX idx_player_availability_week_id ON player_availability(week_id);
CREATE INDEX idx_player_availability_player_id ON player_availability(player_id);

-- Games indexes
CREATE INDEX idx_games_week_id ON games(week_id);
CREATE INDEX idx_games_round_court ON games(week_id, round_number, court_number);

-- Byes indexes
CREATE INDEX idx_byes_week_id ON byes(week_id);
CREATE INDEX idx_byes_player_id ON byes(player_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_seasons_updated_at
    BEFORE UPDATE ON seasons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weeks_updated_at
    BEFORE UPDATE ON weeks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE byes ENABLE ROW LEVEL SECURITY;

-- Seasons policies: admins can only see/modify their own seasons
CREATE POLICY "Users can view their own seasons"
    ON seasons FOR SELECT
    USING (auth.uid() = admin_id);

CREATE POLICY "Users can insert their own seasons"
    ON seasons FOR INSERT
    WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Users can update their own seasons"
    ON seasons FOR UPDATE
    USING (auth.uid() = admin_id)
    WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Users can delete their own seasons"
    ON seasons FOR DELETE
    USING (auth.uid() = admin_id);

-- Players policies: admins can only see/modify their own players
CREATE POLICY "Users can view their own players"
    ON players FOR SELECT
    USING (auth.uid() = admin_id);

CREATE POLICY "Users can insert their own players"
    ON players FOR INSERT
    WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Users can update their own players"
    ON players FOR UPDATE
    USING (auth.uid() = admin_id)
    WITH CHECK (auth.uid() = admin_id);

-- Note: Players cannot be deleted to preserve historical data
-- If needed in future, add: CREATE POLICY "Users can delete their own players" ...

-- Season players policies: based on season ownership
CREATE POLICY "Users can view season_players for their seasons"
    ON season_players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = season_players.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert season_players for their seasons"
    ON season_players FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = season_players.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete season_players for their seasons"
    ON season_players FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = season_players.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

-- Weeks policies: based on season ownership
CREATE POLICY "Users can view weeks for their seasons"
    ON weeks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = weeks.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert weeks for their seasons"
    ON weeks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = weeks.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can update weeks for their seasons"
    ON weeks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = weeks.season_id
            AND seasons.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = weeks.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete weeks for their seasons"
    ON weeks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM seasons
            WHERE seasons.id = weeks.season_id
            AND seasons.admin_id = auth.uid()
        )
    );

-- Player availability policies: based on week/season ownership
CREATE POLICY "Users can view player_availability for their seasons"
    ON player_availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = player_availability.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert player_availability for their seasons"
    ON player_availability FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = player_availability.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can update player_availability for their seasons"
    ON player_availability FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = player_availability.week_id
            AND seasons.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = player_availability.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete player_availability for their seasons"
    ON player_availability FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = player_availability.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

-- Games policies: based on week/season ownership
CREATE POLICY "Users can view games for their seasons"
    ON games FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = games.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert games for their seasons"
    ON games FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = games.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can update games for their seasons"
    ON games FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = games.week_id
            AND seasons.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = games.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete games for their seasons"
    ON games FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = games.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

-- Byes policies: based on week/season ownership
CREATE POLICY "Users can view byes for their seasons"
    ON byes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = byes.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert byes for their seasons"
    ON byes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = byes.week_id
            AND seasons.admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete byes for their seasons"
    ON byes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = byes.week_id
            AND seasons.admin_id = auth.uid()
        )
    );
