-- name: ageDistribution
-- Purpose: Fetch age and sex distribution with optional tenant filtering
-- Params: 
--   tenantId (STRING) - optional
-- Returns: age_group, sex, total
-- Example POST body:
--   {
--     "ref": "ageDistribution",
--     "params": { "tenantId": "your-tenant-id" }
--   }
WITH patient_with_age_group AS (
    SELECT
        CASE
            WHEN "age" BETWEEN 0 AND 10 THEN '0-10'
            WHEN "age" BETWEEN 11 AND 20 THEN '11-20'
            WHEN "age" BETWEEN 21 AND 30 THEN '21-30'
            WHEN "age" BETWEEN 31 AND 40 THEN '31-40'
            WHEN "age" BETWEEN 41 AND 50 THEN '41-50'
            WHEN "age" BETWEEN 51 AND 60 THEN '51-60'
            WHEN "age" > 60 THEN '61+'
            ELSE 'Unknown'
        END AS age_group,
        "sex"
    FROM "Patient"
    WHERE ({{tenantId}} IS NULL OR "tenantId" = {{tenantId}})
)
SELECT age_group, "sex", COUNT(*) as total
FROM patient_with_age_group
GROUP BY age_group, "sex"
ORDER BY 
    CASE 
        WHEN age_group = '0-10' THEN 1
        WHEN age_group = '11-20' THEN 2
        WHEN age_group = '21-30' THEN 3
        WHEN age_group = '31-40' THEN 4
        WHEN age_group = '41-50' THEN 5
        WHEN age_group = '51-60' THEN 6
        WHEN age_group = '61+' THEN 7
        ELSE 8
    END,
    sex;