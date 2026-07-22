# Wildlife Tracker

A full-stack wildlife telemetry tracking application built with [Rayfin](https://aka.ms/rayfin), React, and shadcn/ui, deployed to Microsoft Fabric.

**Live app:** https://snowy-wren-b7eae0367b-northcentralus.webapp.fabricapps.net

## Features

### Dashboard
- Summary stat cards: total animals, active, collared, recent captures (30 days), mortality count
- **Last Known Positions map** — shows the most recent GPS fix for every actively collared animal as clickable markers (indigo = alive, red = mortality); clicking navigates to the animal's detail page
- Active alerts: mortality events and unmonitored animals
- Recent captures feed
- Breakdowns by species and study area (horizontal bar charts)
- Captures-per-month bar chart (last 6 months)

### Animals
- Paginated, searchable table with add/edit/delete
- Animal ID column links to the **Animal Detail page**

### Animal Detail page (`/animals/:id`)
- Bio summary cards: species, population, sex, age class, estimated age, enrollment date
- Collar deployments table with "View track" / "Hide track" buttons
- Lazy-loaded GPS track map for the selected deployment (same map engine as the Telemetry page)
- Capture history table with biologist name resolution

### Telemetry Fixes
- Filter by animal and collar deployment
- Interactive Leaflet map with polyline track, start/end markers, and mortality-flag markers
- Paginated fix log table

### Reference data (full CRUD for each)
- **Species** — common name, scientific name
- **Study Areas** — population, GMU, center coordinates, migratory flag, primary species
- **Collar Models** — vendor, model, VHF beacon MHz, default fix interval, battery life
- **Personnel** — name, role

### Field data (full CRUD for each)
- **Captures** — datetime, coordinates, weight, BCS, capture method, immobilization drug/dose, sample flags, notes
- **Collar Deployments** — collar ID, fix interval, deploy/end dates, end reason

## Data model

| Entity | Key fields |
|--------|-----------|
| `Animals` | animalId, earTagId, sex, ageClass, estAgeYears, currentStatus, mortalityCause → Species, StudyAreas |
| `Captures` | captureId, captureDatetime, lat/lon, bodyWeightKg, BCS, captureMethod, drug/dose, sample flags, notes → Animals, Personnel ×2, CollarDeployments? |
| `CollarDeployments` | collarId, fixIntervalHours, deployDatetime, endDatetime, endReason → Animals, CollarModel |
| `CollarModel` | vendor, model, vhfBeaconMhz, defaultFixIntervalHours, batteryLifeYears |
| `Personnel` | name, role |
| `Species` | commonName, scientificName |
| `StudyAreas` | population, gmu, studyArea, centerLat/Lon, migratory → Species |
| `TelemetryFixes` | fixId, fixDatetimeUtc, lat/lon, altitudeM, fixType, satellites, DOP, temperatureC, activityIndex, mortalityFlag → CollarDeployments |

## Getting started

```bash
# Start local dev server (connects to the deployed Fabric backend)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Sign in with your Microsoft Fabric credentials.

To deploy your own instance:

```bash
npx rayfin login          # authenticate with Entra ID
npx rayfin up             # build, deploy static app, and apply schema migrations
npx rayfin up status      # verify endpoint health
```

## Project structure

```text
├── rayfin/
│   ├── rayfin.yml              # Fabric service configuration (auth, dialect, hosting)
│   └── data/
│       ├── Animals.ts
│       ├── Captures.ts
│       ├── CollarDeployments.ts
│       ├── CollarModel.ts
│       ├── Personnel.ts
│       ├── Species.ts
│       ├── StudyAreas.ts
│       ├── TelemetryFixes.ts
│       └── schema.ts           # AppSchema type + entity list
├── src/
│   ├── App.tsx                 # Routes and auth guard
│   ├── hooks/
│   │   ├── AuthContext.tsx     # Auth context + useAuth hook
│   │   ├── useDashboard.ts     # Dashboard data aggregation + last-known-position fetches
│   │   ├── usePagination.ts
│   │   └── useSearch.ts
│   ├── components/
│   │   ├── AppLayout.tsx       # Sidebar + outlet wrapper
│   │   ├── AppSidebar.tsx      # Navigation, theme toggle, sign out
│   │   └── AuthPage.tsx        # Sign-in UI
│   ├── pages/
│   │   ├── HomePage.tsx              # Dashboard with fleet map
│   │   ├── AnimalsPage.tsx           # Animal list (CRUD)
│   │   ├── AnimalDetailPage.tsx      # Animal profile + telemetry map + captures
│   │   ├── CapturesPage.tsx
│   │   ├── CollarDeploymentsPage.tsx
│   │   ├── CollarModelsPage.tsx
│   │   ├── PersonnelPage.tsx
│   │   ├── SpeciesPage.tsx
│   │   ├── StudyAreasPage.tsx
│   │   └── TelemetryFixesPage.tsx    # GPS track map with deployment selector
│   └── services/
│       ├── animals.ts           # getAnimals, getAnimalById, create/update/delete
│       ├── captures.ts          # getCaptures, getCapturesByAnimal, …
│       ├── collarDeployments.ts # getCollarDeployments, getCollarDeploymentsByAnimal, …
│       ├── collarModels.ts
│       ├── personnel.ts
│       ├── species.ts
│       ├── studyAreas.ts
│       ├── telemetryFixes.ts    # getTelemetryFixesByDeployment, getLastFixByDeployment
│       ├── IAuthService.ts
│       ├── MockAuthService.ts
│       ├── RayfinAuthService.ts
│       ├── rayfinClient.ts      # Typed RayfinClient singleton
│       └── bootstrap.ts         # Env-based auth service selection
└── data/
    ├── *.csv                    # Sample seed data
    └── scripts/                 # SQL INSERT scripts for seeding the database
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server (uses deployed Fabric backend) |
| `npm run build` | Production build |
| `npm run build:fabric` | Build for Fabric static hosting (used by `rayfin up`) |
| `npm run lint` | Lint with ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run rayfin:up` | Full deploy: build + static deploy + schema migrations |
| `npm run rayfin:db` | Apply schema migrations only |
