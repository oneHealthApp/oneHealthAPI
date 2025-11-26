CREATE MATERIALIZED VIEW mv_vaccination_timeline AS
SELECT
    date_trunc('month', "givenAt")::date AS month,
    COUNT(*) AS total_vaccinations
FROM "Vaccination"
GROUP BY month
ORDER BY month;
