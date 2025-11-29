CREATE MATERIALIZED VIEW mv_geo_distribution AS
SELECT
    a.district,
    COUNT(*) AS cases
FROM "Visit" v
JOIN "Patient" p ON p.id = v."patientId"
JOIN "Address" a ON p."addressId" = a.id
GROUP BY a.district
ORDER BY cases DESC;

