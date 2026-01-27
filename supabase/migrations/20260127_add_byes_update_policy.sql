-- Migration: Add missing UPDATE policy for byes table
-- This policy was missing, which prevented saving player swaps that involved byes

CREATE POLICY "Users can update byes for their seasons"
    ON byes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = byes.week_id
            AND seasons.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM weeks
            JOIN seasons ON seasons.id = weeks.season_id
            WHERE weeks.id = byes.week_id
            AND seasons.admin_id = auth.uid()
        )
    );
