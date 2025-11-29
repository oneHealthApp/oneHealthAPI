-- name: followupIntensity
-- Purpose: Fetch patient followup intensity distribution with optional tenant filtering
-- Params: 
--   tenantId (STRING) - optional
-- Returns: bucket, patients
-- Example POST body:
--   {
--     "ref": "followupIntensity",
--     
--   }
SELECT
    bucket,
    patients
FROM mv_followup_intensity
ORDER BY
    CASE 
        WHEN bucket = '1 visit' THEN 1
        WHEN bucket = '2-3 visits' THEN 2
        WHEN bucket = '4-6 visits' THEN 3
        WHEN bucket = '7-10 visits' THEN 4
        WHEN bucket = '11+ visits' THEN 5
        ELSE 6
    END;
