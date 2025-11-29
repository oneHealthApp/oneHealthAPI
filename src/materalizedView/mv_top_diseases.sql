CREATE MATERIALIZED VIEW mv_top_diseases AS
SELECT
    d."icdCode", 
    d.label,
    COUNT(*) AS total_cases
FROM "Diagnosis" d
JOIN "Visit" v ON v.id = d."visitId"  
GROUP BY d."icdCode", d.label
ORDER BY total_cases DESC;