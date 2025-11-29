-- name: weeklyVisitTrend
-- Purpose: Fetch weekly visit trends over time
-- Params: None
-- Returns: week_start, visits
-- Example POST body:
--   {
--     "ref": "weeklyVisitTrend",
--     "params": {}
--   }
SELECT
    week_start,
    visits
FROM mv_weekly_visit_trend
ORDER BY week_start;