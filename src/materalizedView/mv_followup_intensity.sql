CREATE MATERIALIZED VIEW mv_followup_intensity AS
SELECT
    CASE
        WHEN cnt = 1 THEN '1 visit'
        WHEN cnt BETWEEN 2 AND 3 THEN '2-3 visits'
        WHEN cnt BETWEEN 4 AND 6 THEN '4-6 visits'
        WHEN cnt BETWEEN 7 AND 10 THEN '7-10 visits'
        WHEN cnt > 10 THEN '11+ visits'
    END AS bucket,
    COUNT(*) AS patients
FROM (
    SELECT "patientId", COUNT(*) AS cnt  
    FROM "Visit"  
    GROUP BY "patientId"  
) t
GROUP BY bucket;
