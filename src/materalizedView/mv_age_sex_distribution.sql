CREATE MATERIALIZED VIEW mv_age_sex_distribution AS
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
    "sex",
    COUNT(*) AS total
FROM "Patient"  
GROUP BY age_group, "sex"
ORDER BY age_group;


 
