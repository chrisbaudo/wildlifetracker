# Wildlife Tracker

A full-stack wildlife telemetry tracking application built with [Rayfin](https://aka.ms/rayfin), React, and shadcn/ui, deployed to Microsoft Fabric.

**Live app:** https://snowy-wren-b7eae0367b-northcentralus.webapp.fabricapps.net

## Problem statement

Wildlife biologists and field technicians spend significant time managing GPS collar data across disconnected spreadsheets, per-study databases, and proprietary vendor portals. There is no single place to cross-reference capture records, collar health, and real-time telemetry — making it hard to detect equipment failures, mortality events, or coverage gaps before they become costly.

## Target user

- **Wildlife biologists and researchers** who deploy GPS collars on wild animals (ungulates, carnivores, birds) and need to monitor fleet health and animal status from the office or the field.
- **Field technicians** who record capture data and collar deployments and need a fast, mobile-friendly data-entry interface.
- **Project managers** who need summary dashboards and exportable datasets for grant reporting and regulatory submissions.

## Microsoft Fabric technologies

- **Fabric SQL Database** for relational wildlife, capture, collar, and telemetry data
- **Fabric Eventstream** for real-time telemetry ingestion
- **Fabric KQL Database** for real-time telemetry storage and analysis
- **Fabric Real-Time Dashboard** for live animal locations and collar telemetry visualization
- **Power BI semantic model and report** for animal-specific GPS track visualization
- **Fabric Static Web Apps** for hosting the React application
- **Fabric SSO with Microsoft Entra ID** for authentication in the deployed application
- **Rayfin and Data API Builder** for typed data APIs, schema deployment, and access control

## Solution architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser (React + shadcn/ui)                                         │
│  ┌─────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │  Dashboard  │  │  CRUD pages (8)     │  │ Embedded analytics   │ │
│  │  + alerts   │  │  + CSV export       │  │ Fabric RTD + Power BI│ │
│  └──────┬──────┘  └────────┬────────────┘  └──────────────────────┘ │
│         └─────────────────►│ RayfinClient (typed SDK) │              │
└─────────────────────────────────────────────────────────────────────┘
                              │ GraphQL / REST
┌─────────────────────────────▼─────────────────────────────────────────┐
│  Rayfin (Data API Builder on Microsoft Fabric)                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  rayfin.yml — auth (Entra ID + password), mssql dialect,          │ │
│  │               static hosting, entity-level RLS policies           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Entity schema (TypeScript decorators → SQL DDL via rayfin up)         │
│  Animals · Captures · CollarDeployments · CollarModel ·               │
│  Personnel · Species · StudyAreas · TelemetryFixes                     │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ TDS / mssql
┌───────────────────────────────▼───────────────────┐
│  Microsoft Fabric SQL Database                    │
│  (managed, serverless, Entra-integrated)          │
└───────────────────────────────────────────────────┘
```

**What was built:**

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | SPA with routing, auth guard, and embedded real-time analytics |
| UI components | shadcn/ui (Radix) + Tailwind CSS | Accessible, themeable component library |
| Real-time analytics | Fabric Real-Time Dashboard + Eventstream + KQL Database | Live wildlife telemetry visualization |
| Embedded analytics | Power BI report + JavaScript SDK | Animal-specific telemetry map filtered by `animal_id` |
| API / auth | Rayfin (Data API Builder) | Auto-generated GraphQL + REST endpoints from TypeScript entity decorators; Fabric SSO in deployed apps and password auth for local development |
| Database | Microsoft Fabric SQL Database (mssql) | Relational store for all telemetry, capture, and reference data |
| Hosting | Fabric Static Web Apps (via `rayfin up`) | Zero-config CDN hosting co-located with the data backend |
| Auth | Microsoft Entra ID (Fabric SSO) | Single sign-on for Microsoft-authenticated users inside the Fabric portal |

## Features

### Dashboard
- Summary stat cards: total animals, active, collared, recent captures (30 days), mortality count
- Embedded **Fabric Real-Time Dashboard** for live collar positions and telemetry
- **Active alerts** with three severity types:
  - *Mortality* — animal status flagged as deceased
  - *Stale Fix* — active collar hasn't reported in > 2× its fix interval (e.g. collar set to 4 h with no fix in 8 h)
  - *Unmonitored* — alive animal with no active collar deployment
- Recent captures feed
- Breakdowns by species and study area (horizontal bar charts)
- Captures-per-month bar chart (last 6 months)

### Animals
- Paginated, searchable, **sortable** table with add/edit/delete
- Animal ID column links to the **Animal Detail page**
- **Export CSV** — downloads all currently filtered records

### Animal Detail page (`/animals/:id`)
- Bio summary cards: species, population, sex, age class, estimated age, enrollment date
- Collar deployments table with "View track" / "Hide track" buttons
- Embedded **wildlifetelemetrydetail** Power BI report filtered to the selected animal through `Query.animal_id`
- Capture history table with biologist name resolution
- Edit button opens the animal edit sheet inline

### Telemetry Fixes
- Filter by animal and collar deployment
- Embedded **wildlifetelemetrydetail** Power BI report filtered to the animal associated with the selected deployment
- **Sortable** fix log table
- **Export CSV** — downloads all fixes for the selected deployment

### Reference data (full CRUD + CSV export + sortable columns for each)
- **Species** — common name, scientific name
- **Study Areas** — population, GMU, center coordinates, migratory flag, primary species
- **Collar Models** — vendor, model, VHF beacon MHz, default fix interval, battery life
- **Personnel** — name, role

### Field data (full CRUD + CSV export + sortable columns for each)
- **Captures** — datetime, coordinates, weight, BCS, capture method, immobilization drug/dose, sample flags, notes
- **Collar Deployments** — collar ID, fix interval, deploy/end dates, end reason

### Shared UX patterns (all tables)
- **Navigation and theme defaults** — the desktop sidebar opens by default and the initial color mode is light; users can still collapse the menu or select dark mode
- **Column sorting** — click any column header to sort asc/desc; indicator icons show current state
- **CSV export** — "Export CSV" button exports the current filtered dataset with human-readable column names; FK IDs are resolved to display names (e.g. species name instead of UUID)
- **Search filter** — live search across all string fields
- **Pagination** — 10 rows/page; resets automatically on search or sort change

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
# Install dependencies
npm install

# Start Rayfin services and the Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The `dev` script starts the Rayfin backend without static hosting, generates the Vite environment, and then starts Vite. Password authentication is available locally; Fabric SSO is used by the deployed app inside the Fabric portal.

Create a Real-Time Dashboard using the `wildlifetelemetry` KQL Database and a Power BI report for animal telemetry details. The report must expose `Query.animal_id`, `Query.latitude`, `Query.longitude`, and `Query.fix_datetime_utc`; configure its Azure Maps visual with `animal_id` as the series and `fix_datetime_utc` as the path/point identifier. A 16:9 report page fills the responsive embed without letterboxing or internal scrolling.

Register a Microsoft Entra SPA with delegated `Fabric.Embed`, `KQLDashboard.Read.All`, `Workspace.Read.All`, `Item.Read.All`, and Power BI `Report.Read.All` permissions. Because Fabric and Power BI share the same resource application, grant all five scopes together so a later consent update does not replace the dashboard scopes. Add `<app-origin>/fabric-embed-redirect.html` as its SPA redirect URI, then configure the embeds in `rayfin/.env`:

```bash
RAYFIN_PUBLIC_REALTIME_DASHBOARD_CLIENT_ID=<entra-app-client-id>
RAYFIN_PUBLIC_REALTIME_DASHBOARD_ITEM_ID=<real-time-dashboard-item-id>
RAYFIN_PUBLIC_POWERBI_TELEMETRY_REPORT_ID=<power-bi-report-id>
RAYFIN_PUBLIC_POWERBI_TELEMETRY_REPORT_EMBED_URL=<power-bi-report-embed-url>
RAYFIN_PUBLIC_POWERBI_TELEMETRY_REPORT_URL=<power-bi-browser-url>
```

The workspace and tenant IDs are populated by `rayfin up`. The signed-in user must have access to both embedded items. When embed configuration is incomplete, the app displays a configuration state instead of an empty frame.

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
│   │   ├── useDashboard.ts     # Dashboard data aggregation + last-known-position fetches + stale-collar detection
│   │   ├── usePagination.ts
│   │   ├── useSearch.ts
│   │   └── useSorting.ts       # Generic column-sort hook (asc/desc toggle, numeric/date/string compare)
│   ├── components/
│   │   ├── AppLayout.tsx       # Sidebar + outlet wrapper
│   │   ├── AppSidebar.tsx      # Navigation, theme toggle, sign out
│   │   ├── AuthPage.tsx        # Sign-in UI
│   │   ├── FabricRealtimeDashboard.tsx # Fabric KQL dashboard embed
│   │   ├── PowerBIAnimalTelemetryReport.tsx # Animal-filtered Power BI report embed
│   │   └── ui/
│   │       ├── pager.tsx           # Shared table pagination controls
│   │       └── sortable-head.tsx  # Sortable <TableHead> with chevron indicators
│   ├── pages/
│   │   ├── HomePage.tsx              # Summary + Fabric Real-Time Dashboard
│   │   ├── AnimalsPage.tsx           # Animal list (CRUD)
│   │   ├── AnimalDetailPage.tsx      # Animal profile + filtered Power BI report + captures
│   │   ├── CapturesPage.tsx
│   │   ├── CollarDeploymentsPage.tsx
│   │   ├── CollarModelsPage.tsx
│   │   ├── PersonnelPage.tsx
│   │   ├── SpeciesPage.tsx
│   │   ├── StudyAreasPage.tsx
│   │   └── TelemetryFixesPage.tsx    # Real-time dashboard with deployment selector
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
│       ├── fabricEmbedAuth.ts   # MSAL token acquisition for Fabric and Power BI embeds
│       ├── rayfinClient.ts      # Typed RayfinClient singleton
│       └── bootstrap.ts         # Env-based auth service selection
│   └── lib/
│       └── exportCsv.ts         # CSV download utility (UTF-8 BOM, field escaping)
├── fabric-embed-redirect.html   # MSAL redirect page for embedded Fabric content
└── data/
    ├── *.csv                    # Sample seed data
    └── scripts/                 # SQL INSERT scripts for seeding the database
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Rayfin services without static hosting, then start Vite |
| `npm run build` | Production build |
| `npm run build:fabric` | Build for Fabric static hosting (used by `rayfin up`) |
| `npm run lint` | Lint with ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run rayfin:db` | Apply schema migrations only |
