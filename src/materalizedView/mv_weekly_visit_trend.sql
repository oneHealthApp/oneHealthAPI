CREATE MATERIALIZED VIEW mv_weekly_visit_trend AS
SELECT
    date_trunc('week', "startedAt")::date AS week_start, 
    COUNT(*) AS visits
FROM  "Visit"  
GROUP BY week_start
ORDER BY week_start;