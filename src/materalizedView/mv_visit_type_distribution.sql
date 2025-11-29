CREATE MATERIALIZED VIEW mv_visit_type_distribution AS
SELECT
    "visitType",  
    COUNT(*) AS total_visits
FROM "Visit"  
GROUP BY "visitType"  
ORDER BY total_visits DESC;
