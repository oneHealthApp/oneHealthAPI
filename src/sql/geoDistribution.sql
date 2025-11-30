-- name: geoDistribution
-- Purpose: Fetch geographic distribution of cases by district
-- Params: None
-- Returns: district, cases
-- Example POST body:
--   {
--     "ref": "geoDistribution",
--     "params": {}
--   }
SELECT
    district,
    cases
FROM mv_geo_distribution
ORDER BY cases DESC;