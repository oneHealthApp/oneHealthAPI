-- name: vaccinationTimeline
-- Purpose: Fetch vaccination timeline by month
-- Params: None
-- Returns: month, total_vaccinations
-- Example POST body:
--   {
--     "ref": "vaccinationTimeline",
--     "params": {}
--   }
SELECT
    month,
    total_vaccinations
FROM mv_vaccination_timeline
ORDER BY month;