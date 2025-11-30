-- name: topDiseases
-- Purpose: Fetch top diseases by case count
-- Params: None
-- Returns: icdCode, label, total_cases
-- Example POST body:
--   {
--     "ref": "topDiseases",
--     "params": {}
--   }
SELECT
    "icdCode",
    label,
    total_cases
FROM mv_top_diseases
ORDER BY total_cases DESC;