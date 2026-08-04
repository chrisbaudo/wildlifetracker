# Seed Data

Load the CSV files into staging tables, then run the numbered SQL scripts in order. The order ensures every referenced row exists before its dependents are inserted.

## Staging tables

- `staging.species`
- `staging.personnel`
- `staging.collar_models`
- `staging.study_areas`
- `staging.animals`
- `staging.captures`
- `staging.collar_deployments`
- `staging.telemetry`

## Script order

1. `1-INSERT INTO Species`
2. `1-INSERT INTO Personnel`
3. `1-INSERT INTO CollarModel`
4. `2-INSERT INTO StudyAreas`
5. `3-INSERT INTO Animals`
6. `4-INSERT INTO Captures`
7. `5-INSERT INTO CollarDeployments`
8. `6-INSERT INTO TelemetryFixes`

The collar deployment script also links captures to their optional deployment after both records exist.

Use `generate_telemetry.py` to regenerate `data/telemetry.csv` when sample telemetry needs to be refreshed.
