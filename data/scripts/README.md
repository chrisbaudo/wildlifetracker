# Seed Data Loading Order

## Overview
The normalized schema extracts reference tables and uses foreign key relationships. Load the staging CSVs first, then run the numbered SQL scripts in order so each referenced row exists before it is used.

## Prerequisites
1. Load all CSV files into staging tables:
   - `staging.species`
   - `staging.personnel`
   - `staging.collar_models`
   - `staging.study_areas`
   - `staging.animals`
   - `staging.captures`
   - `staging.collar_deployments`
   - `staging.telemetry`

## Loading Order

### Step 1: Load Reference Tables (No Dependencies)
These tables have no foreign key dependencies and can be loaded in any order:

1. **Species** - `INSERT INTO Species`
2. **Personnel** - `INSERT INTO Personnel`
3. **CollarModel** - `INSERT INTO CollarModel`

### Step 2: Load StudyAreas (Depends on Species)
4. **StudyAreas** - `INSERT INTO StudyAreas`
   - Requires: Species

### Step 3: Load Animals (Depends on Species and StudyAreas)
5. **Animals** - `INSERT INTO Animals`
   - Requires: Species, StudyAreas

### Step 4: Load Captures (Depends on Animals and Personnel)
6. **Captures** - `INSERT INTO Captures`
   - Requires: Animals, Personnel

### Step 5: Load CollarDeployments and Link Captures
7. **CollarDeployments** - `INSERT INTO CollarDeployments`
   - The entity requires: Animals, CollarModel
   - The script runs after Captures so it can backfill the optional `Captures.collarDeployment_id` relationship

### Step 6: Load TelemetryFixes (Depends on CollarDeployments)
8. **TelemetryFixes** - `INSERT INTO TelemetryFixes`
   - Requires: CollarDeployments

## Key Changes from Original Schema

### Removed Redundant Fields
- **Animal**: Removed `species` (text), `scientificName`, `population`, `gmu`, `currentCollarId`
- **Capture**: Removed `gmu`, `studyArea`, `sex`, `ageClass`, `estAgeYears`, `biologist` (text), `pilot` (text), `collarId` (text)
- **CollarDeployment**: Removed `vendor`, `model`, `vhfBeaconMhz`, `batteryLifeYears`, `deployLat`, `deployLon`
- **StudyArea**: Removed `species` (text), `nCollared` (calculated)
- **TelemetryFix**: Removed `vendor`, `animal_id` (direct relationship)

### Added Foreign Key Relationships
- **Animal** -> Species (via `species_id`)
- **Animal** -> StudyAreas (via `studyArea_id`)
- **StudyArea** -> Species (via `primarySpecies_id`)
- **Capture** -> Animals (via `animal_id`)
- **Capture** -> Personnel x2 (via `biologist_id` and `pilot_id`)
- **Capture** -> CollarDeployments (optional, via `collarDeployment_id`)
- **CollarDeployment** -> Animals (via `animal_id`)
- **CollarDeployment** -> CollarModel (via `collarModel_id`)
- **TelemetryFix** -> CollarDeployments (via `collarDeployment_id`)

## Benefits
- Full Third Normal Form (3NF) compliance
- No transitive dependencies
- Single source of truth for reference data
- Reduced data redundancy
- Improved data integrity through foreign key constraints
- Easier maintenance (update once, reflect everywhere)
