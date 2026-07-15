#!/usr/bin/env python3
"""
generate_telemetry.py
Regenerate data/telemetry.csv with biologically realistic migration paths.

Key improvements over the original random-walk data:
  - Western Arctic Herd caribou: dramatic N-S migration (65°N winter → 69°N calving)
  - Nelchina / Fortymile caribou: moderate seasonal elevation/range shifts
  - Brown bears: near-stationary at den site (Nov-Mar), wide summer foraging range
  - Dall Sheep: altitudinal migration over a realistic mountain home range
  - Moose & Muskox: small seasonal home-range drift (biologically appropriate)

Each animal follows a biased correlated random walk whose seasonal "attractor"
is interpolated from 12 monthly waypoints calibrated to documented range use.

Usage (from project root):
    python data/scripts/generate_telemetry.py
"""

import csv
import math
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent

# ── Geographic helpers ────────────────────────────────────────────────────────

def km_to_dlat(km: float) -> float:
    return km / 111.0

def km_to_dlon(km: float, lat_deg: float) -> float:
    cos_lat = math.cos(math.radians(lat_deg))
    return km / (111.0 * cos_lat) if cos_lat > 1e-6 else 0.0

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    d = math.radians
    dlat = d(lat2 - lat1)
    dlon = d(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(d(lat1)) * math.cos(d(lat2)) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(max(0.0, a)))

# ── Seasonal migration targets (12 monthly waypoints) ────────────────────────
#
# Each value is a (target_lat, target_lon) for month 1 (Jan) → month 12 (Dec).
# The animal's path is continuously attracted toward the interpolated target;
# the strength of the attraction grows with distance from it.

SEASONAL_TARGETS: dict[str, list[tuple[float, float]]] = {
    # ── Western Arctic Herd ────────────────────────────────────────────────
    # Largest caribou migration in North America.
    # Winter: south of Brooks Range ~65-66 N; Calving: Arctic Coastal Plain ~69-70 N.
    "Western Arctic Herd": [
        (65.5, -157.5),   # Jan  – winter range (boreal, south of Brooks Range)
        (65.5, -157.8),   # Feb  – winter range
        (65.9, -158.3),   # Mar  – earliest movement begins
        (67.1, -159.2),   # Apr  – active spring migration (Noatak corridor)
        (68.6, -160.3),   # May  – through Brooks Range passes
        (69.5, -161.5),   # Jun  – calving grounds (Arctic Coastal Plain)
        (69.8, -160.8),   # Jul  – post-calving dispersal
        (69.1, -159.8),   # Aug  – starting south
        (67.6, -158.7),   # Sep  – fall migration through passes
        (66.4, -157.8),   # Oct  – approaching winter range
        (65.8, -157.6),   # Nov  – settling into winter range
        (65.5, -157.5),   # Dec  – winter range
    ],
    # ── Nelchina Herd ─────────────────────────────────────────────────────
    # Central Alaska; smaller migration up into Alaska Range foothills in summer.
    "Nelchina Herd": [
        (61.9, -147.8),   # Jan  – winter range (Talkeetna lowlands)
        (61.9, -147.8),   # Feb
        (62.1, -147.5),   # Mar  – starting to move
        (62.4, -147.2),   # Apr  – early spring movement
        (62.8, -146.9),   # May  – summer range
        (63.1, -146.5),   # Jun  – high summer (Alaska Range foothills)
        (63.2, -146.3),   # Jul  – peak summer range
        (63.0, -146.6),   # Aug  – beginning south
        (62.6, -147.0),   # Sep  – fall rut
        (62.2, -147.4),   # Oct  – moving to winter range
        (62.0, -147.7),   # Nov
        (61.9, -147.8),   # Dec  – winter range
    ],
    # ── Fortymile Herd ────────────────────────────────────────────────────
    # Eastern Interior Alaska; can cross into Yukon in summer.
    "Fortymile Herd": [
        (63.8, -143.5),   # Jan  – winter range (lower Fortymile country)
        (63.8, -143.5),   # Feb
        (64.0, -143.1),   # Mar  – starting north
        (64.4, -142.6),   # Apr  – spring movement
        (64.8, -142.0),   # May  – summer range
        (65.1, -141.7),   # Jun  – can cross into Yukon
        (65.2, -141.6),   # Jul  – peak summer
        (64.9, -142.1),   # Aug  – beginning south
        (64.4, -142.7),   # Sep  – fall rut
        (64.1, -143.2),   # Oct  – returning to winter range
        (63.9, -143.4),   # Nov
        (63.8, -143.5),   # Dec
    ],
    # ── Moose populations ─────────────────────────────────────────────────
    # Moose are non-migratory; small seasonal home-range shifts only.
    "Nelchina Basin Moose": [
        (62.29, -146.46),  # Jan
        (62.28, -146.47),  # Feb  – slightly lower / more sheltered in winter
        (62.29, -146.46),  # Mar
        (62.31, -146.44),  # Apr  – slight spring shift to higher ground
        (62.34, -146.41),  # May
        (62.36, -146.39),  # Jun  – summer range (riparian corridors, higher)
        (62.35, -146.40),  # Jul
        (62.32, -146.43),  # Aug
        (62.29, -146.46),  # Sep  – rut
        (62.27, -146.48),  # Oct
        (62.27, -146.48),  # Nov
        (62.29, -146.46),  # Dec
    ],
    "Tanana Flats Moose": [
        (64.19, -147.66),  # Jan
        (64.19, -147.66),  # Feb
        (64.20, -147.64),  # Mar
        (64.21, -147.62),  # Apr
        (64.23, -147.59),  # May  – slightly higher ground / river bars
        (64.24, -147.57),  # Jun
        (64.24, -147.57),  # Jul
        (64.22, -147.60),  # Aug
        (64.20, -147.63),  # Sep  – rut
        (64.19, -147.66),  # Oct
        (64.19, -147.66),  # Nov
        (64.19, -147.66),  # Dec
    ],
    "Kenai Peninsula Moose": [
        (60.49, -150.35),  # Jan
        (60.49, -150.35),  # Feb
        (60.50, -150.33),  # Mar
        (60.51, -150.32),  # Apr
        (60.52, -150.30),  # May  – slightly higher / more dispersed
        (60.53, -150.29),  # Jun
        (60.52, -150.30),  # Jul
        (60.51, -150.31),  # Aug
        (60.49, -150.34),  # Sep  – rut
        (60.48, -150.36),  # Oct
        (60.48, -150.36),  # Nov
        (60.49, -150.35),  # Dec
    ],
    # ── Dall Sheep ────────────────────────────────────────────────────────
    # Altitudinal migration: lower/sheltered terrain in winter, high alpine in summer.
    "Alaska Range Sheep": [
        (63.26, -146.28),  # Jan  – lower elevation, sheltered cliff bands
        (63.26, -146.28),  # Feb
        (63.30, -146.24),  # Mar  – starting upslope
        (63.36, -146.20),  # Apr  – moving to lower alpine
        (63.42, -146.16),  # May  – upper alpine
        (63.46, -146.12),  # Jun  – peak summer range (high ridges)
        (63.48, -146.10),  # Jul  – highest elevations
        (63.45, -146.13),  # Aug  – still high
        (63.40, -146.18),  # Sep  – rut; bucks move widely
        (63.33, -146.23),  # Oct  – descending
        (63.27, -146.27),  # Nov
        (63.26, -146.28),  # Dec
    ],
    "Brooks Range Sheep": [
        (67.52, -150.18),  # Jan  – sheltered valleys, windswept ridges
        (67.52, -150.18),  # Feb
        (67.56, -150.16),  # Mar  – moving up
        (67.61, -150.14),  # Apr  – lower alpine
        (67.66, -150.12),  # May
        (67.70, -150.10),  # Jun  – peak summer
        (67.71, -150.09),  # Jul
        (67.69, -150.11),  # Aug
        (67.63, -150.14),  # Sep  – rut
        (67.56, -150.17),  # Oct
        (67.53, -150.18),  # Nov
        (67.52, -150.18),  # Dec
    ],
    # ── Brown Bears ───────────────────────────────────────────────────────
    # Den Oct/Nov → March/April; wide summer foraging range.
    # Alaska Peninsula animals travel to salmon streams in July–September.
    "Alaska Peninsula Brown Bear": [
        (57.55, -156.43),  # Jan  – denning (minimal movement)
        (57.55, -156.43),  # Feb  – denning
        (57.55, -156.43),  # Mar  – denning (emerge late Mar / early Apr)
        (57.57, -156.41),  # Apr  – emergence; feeding on beach sedges
        (57.63, -156.35),  # May  – spring foraging range expands
        (57.80, -156.15),  # Jun  – wide summer range; bears travel to sedge flats
        (57.90, -156.00),  # Jul  – salmon runs begin (Ugashik, Naknek drainages)
        (57.85, -156.10),  # Aug  – peak salmon / hyperphagia
        (57.68, -156.30),  # Sep  – berries + late salmon; pre-denning
        (57.58, -156.41),  # Oct  – entering den
        (57.55, -156.43),  # Nov  – denning
        (57.55, -156.43),  # Dec  – denning
    ],
    "Nelchina Brown Bear": [
        (62.40, -146.91),  # Jan  – denning
        (62.40, -146.91),  # Feb  – denning
        (62.40, -146.91),  # Mar  – denning
        (62.41, -146.90),  # Apr  – emergence
        (62.47, -146.84),  # May  – spring foraging
        (62.57, -146.70),  # Jun  – wide summer range
        (62.63, -146.63),  # Jul  – peak activity; foraging upland
        (62.58, -146.70),  # Aug  – berries / hyperphagia
        (62.46, -146.84),  # Sep  – pre-denning
        (62.41, -146.90),  # Oct  – entering den
        (62.40, -146.91),  # Nov  – denning
        (62.40, -146.91),  # Dec  – denning
    ],
    # ── Muskox ────────────────────────────────────────────────────────────
    # Year-round residents; small seasonal range shift (essentially non-migratory).
    "Seward Peninsula Muskox": [
        (64.90, -164.30),  # Jan
        (64.90, -164.30),  # Feb
        (64.91, -164.28),  # Mar
        (64.92, -164.26),  # Apr  – slight spring dispersal
        (64.93, -164.24),  # May
        (64.94, -164.23),  # Jun  – summer range
        (64.93, -164.24),  # Jul
        (64.92, -164.26),  # Aug
        (64.90, -164.29),  # Sep  – rut
        (64.89, -164.31),  # Oct
        (64.89, -164.31),  # Nov
        (64.90, -164.30),  # Dec
    ],
}

# ── Movement parameters ───────────────────────────────────────────────────────
#
# base_km   : typical step (km) per fix interval during resident / non-migration season
# migrate_km: typical step during active migration / wide foraging season
# drift     : weight [0-1] toward seasonal attractor; stronger = more directed movement
# corr      : autocorrelation in random direction [0-1]; higher = straighter paths

MOVEMENT_PARAMS: dict[str, dict] = {
    "Western Arctic Herd":          {"base": 1.8,  "migrate": 8.5,  "drift": 0.28, "corr": 0.55},
    "Nelchina Herd":                {"base": 1.5,  "migrate": 3.8,  "drift": 0.22, "corr": 0.50},
    "Fortymile Herd":               {"base": 1.8,  "migrate": 4.5,  "drift": 0.22, "corr": 0.50},
    "Nelchina Basin Moose":         {"base": 0.7,  "migrate": 1.4,  "drift": 0.12, "corr": 0.45},
    "Tanana Flats Moose":           {"base": 0.7,  "migrate": 1.4,  "drift": 0.12, "corr": 0.45},
    "Kenai Peninsula Moose":        {"base": 0.7,  "migrate": 1.4,  "drift": 0.12, "corr": 0.45},
    "Alaska Range Sheep":           {"base": 0.45, "migrate": 1.3,  "drift": 0.20, "corr": 0.40},
    "Brooks Range Sheep":           {"base": 0.45, "migrate": 1.3,  "drift": 0.20, "corr": 0.40},
    "Alaska Peninsula Brown Bear":  {"base": 1.2,  "migrate": 7.0,  "drift": 0.22, "corr": 0.50},
    "Nelchina Brown Bear":          {"base": 1.2,  "migrate": 7.0,  "drift": 0.22, "corr": 0.50},
    "Seward Peninsula Muskox":      {"base": 0.40, "migrate": 0.70, "drift": 0.10, "corr": 0.35},
}

# Months when each population is in active migration / peak foraging mode
MIGRATION_MONTHS: dict[str, set[int]] = {
    "Western Arctic Herd":          {3, 4, 5, 8, 9, 10},
    "Nelchina Herd":                {4, 5, 9, 10},
    "Fortymile Herd":               {4, 5, 9, 10},
    "Nelchina Basin Moose":         set(),
    "Tanana Flats Moose":           set(),
    "Kenai Peninsula Moose":        set(),
    "Alaska Range Sheep":           {4, 5, 9, 10},
    "Brooks Range Sheep":           {4, 5, 9, 10},
    "Alaska Peninsula Brown Bear":  {5, 6, 7, 8, 9},
    "Nelchina Brown Bear":          {5, 6, 7, 8, 9},
    "Seward Peninsula Muskox":      set(),
}

# Bears denning: movement collapses to near-zero; temperature reads as cave air
BEAR_DEN_MONTHS: set[int] = {1, 2, 3, 11, 12}

# Hard geographic bounding boxes (lat_min, lat_max, lon_min, lon_max)
BOUNDS: dict[str, tuple[float, float, float, float]] = {
    "Western Arctic Herd":          (64.0, 71.0, -169.0, -153.0),
    "Nelchina Herd":                (61.0, 64.5, -151.0, -143.5),
    "Fortymile Herd":               (63.0, 66.5, -145.5, -139.5),
    "Nelchina Basin Moose":         (61.9, 62.8, -147.5, -145.5),
    "Tanana Flats Moose":           (63.8, 64.7, -148.5, -146.5),
    "Kenai Peninsula Moose":        (60.0, 61.2, -151.5, -149.0),
    "Alaska Range Sheep":           (62.9, 63.9, -147.2, -145.5),
    "Brooks Range Sheep":           (67.1, 68.4, -151.8, -148.5),
    "Alaska Peninsula Brown Bear":  (56.2, 59.5, -162.0, -153.5),
    "Nelchina Brown Bear":          (61.5, 63.5, -148.5, -145.0),
    "Seward Peninsula Muskox":      (64.2, 65.9, -166.5, -162.0),
}

# ── Altitude profiles (m) ─────────────────────────────────────────────────────

ALT_RANGES: dict[str, dict[str, tuple[int, int]]] = {
    "Western Arctic Herd":          {"summer": (80,  500),  "winter": (200, 750)},
    "Nelchina Herd":                {"summer": (600, 1700), "winter": (300, 950)},
    "Fortymile Herd":               {"summer": (500, 1300), "winter": (300, 850)},
    "Nelchina Basin Moose":         {"summer": (300, 850),  "winter": (200, 650)},
    "Tanana Flats Moose":           {"summer": (180, 550),  "winter": (140, 400)},
    "Kenai Peninsula Moose":        {"summer": (80,  450),  "winter": (40,  300)},
    "Alaska Range Sheep":           {"summer": (1200,2200), "winter": (700, 1600)},
    "Brooks Range Sheep":           {"summer": (950, 1950), "winter": (550, 1350)},
    "Alaska Peninsula Brown Bear":  {"summer": (40,  450),  "winter": (180, 650)},
    "Nelchina Brown Bear":          {"summer": (400, 1250), "winter": (450, 1150)},
    "Seward Peninsula Muskox":      {"summer": (100, 520),  "winter": (80,  420)},
}

# ── Temperature model ─────────────────────────────────────────────────────────
# Monthly mean (°C) at 65 °N in Interior/Arctic Alaska
_TEMP_65N = [-22, -20, -14, -4, 4, 13, 15, 12, 5, -4, -14, -21]
_LAT_LAPSE = 0.7  # °C colder per degree N above 65 °N

def seasonal_temperature(lat: float, month: int) -> float:
    base = _TEMP_65N[month - 1]
    return round(base - (lat - 65.0) * _LAT_LAPSE + random.gauss(0, 2.5), 1)

# ── Step generation ───────────────────────────────────────────────────────────

def get_seasonal_target(population: str, dt: datetime) -> tuple[float, float]:
    """Interpolate monthly waypoints to get the attractor for dt."""
    wpts = SEASONAL_TARGETS[population]
    m0 = dt.month - 1                     # 0-indexed current month
    m1 = (m0 + 1) % 12
    frac = (dt.day - 1) / 30.44           # fraction through this month
    lat = wpts[m0][0] * (1 - frac) + wpts[m1][0] * frac
    lon = wpts[m0][1] * (1 - frac) + wpts[m1][1] * frac
    return lat, lon

def is_denning(population: str, dt: datetime) -> bool:
    return "Brown Bear" in population and dt.month in BEAR_DEN_MONTHS

def step_km(population: str, dt: datetime, params: dict) -> float:
    if is_denning(population, dt):
        return random.uniform(0.02, 0.08)  # near-stationary at den
    if dt.month in MIGRATION_MONTHS[population]:
        return abs(random.gauss(params["migrate"], params["migrate"] * 0.35))
    return abs(random.gauss(params["base"], params["base"] * 0.45))

def clamp_to_bounds(lat, lon, bounds):
    lat_min, lat_max, lon_min, lon_max = bounds
    if lat < lat_min:
        lat = lat_min + (lat_min - lat) * 0.5
    elif lat > lat_max:
        lat = lat_max - (lat - lat_max) * 0.5
    if lon < lon_min:
        lon = lon_min + (lon_min - lon) * 0.5
    elif lon > lon_max:
        lon = lon_max - (lon - lon_max) * 0.5
    return lat, lon

def generate_step(
    cur_lat: float, cur_lon: float,
    tgt_lat: float, tgt_lon: float,
    dist_km: float,
    drift_alpha: float,
    prev_dx: float, prev_dy: float,
    corr: float,
) -> tuple[float, float, float, float]:
    """
    Biased correlated random walk toward (tgt_lat, tgt_lon).
    Returns (new_lat, new_lon, new_prev_dx, new_prev_dy).
    """
    # ── direction toward target (unit vector in km-space) ──────────────────
    dlat_km = (tgt_lat - cur_lat) * 111.0
    dlon_km = (tgt_lon - cur_lon) * 111.0 * math.cos(math.radians(cur_lat))
    dist_to_tgt = math.sqrt(dlat_km ** 2 + dlon_km ** 2)

    if dist_to_tgt > 0.1:
        tx = dlat_km / dist_to_tgt
        ty = dlon_km / dist_to_tgt
    else:
        tx = ty = 0.0

    # Pull strength grows with distance (saturates at 100 km away)
    alpha = min(1.0, dist_to_tgt / 80.0) * drift_alpha

    # ── correlated random direction ────────────────────────────────────────
    theta = random.uniform(0, 2 * math.pi)
    rx, ry = math.cos(theta), math.sin(theta)

    if abs(prev_dx) + abs(prev_dy) > 0.01:
        rx = (1 - corr) * rx + corr * prev_dx
        ry = (1 - corr) * ry + corr * prev_dy
        m = math.sqrt(rx ** 2 + ry ** 2)
        if m > 0:
            rx, ry = rx / m, ry / m

    # ── blend random + drift ───────────────────────────────────────────────
    dx = (1 - alpha) * rx + alpha * tx
    dy = (1 - alpha) * ry + alpha * ty
    m = math.sqrt(dx ** 2 + dy ** 2)
    if m > 0:
        dx, dy = dx / m, dy / m

    new_lat = cur_lat + dx * km_to_dlat(dist_km)
    new_lon = cur_lon + dy * km_to_dlon(dist_km, cur_lat)

    return new_lat, new_lon, dx, dy

# ── Altitude with autocorrelation ─────────────────────────────────────────────

def update_altitude(prev_alt: float, population: str, month: int) -> int:
    is_summer = 4 <= month <= 9
    key = "summer" if is_summer else "winter"
    lo, hi = ALT_RANGES[population][key]
    target = (lo + hi) / 2.0
    # Autoregressive smoothing (AR-1)
    new_alt = 0.92 * prev_alt + 0.08 * target + random.gauss(0, (hi - lo) * 0.04)
    return int(max(lo, min(hi, new_alt)))

# ── Metadata helpers ──────────────────────────────────────────────────────────

def fix_type_and_sats():
    if random.random() < 0.83:
        return "3D", random.randint(5, 12)
    return "2D", random.randint(4, 8)

def dop_value(fix_type: str) -> float:
    if fix_type == "3D":
        return round(random.uniform(0.5, 3.0), 1)
    return round(random.uniform(1.5, 5.5), 1)

def activity_index(population: str, dt: datetime, dying: bool) -> int:
    if dying:
        return random.randint(0, 20)
    if is_denning(population, dt):
        return random.randint(0, 12)
    hour = dt.hour
    if 5 <= hour <= 22:
        return random.randint(70, 250)
    return random.randint(8, 80)

VENDOR_PREFIX_MAP = {"LOT": "Lotek", "ATS": "ATS", "VEC": "Vectronic Aerospace", "TLN": "Telonics"}

def collar_vendor(collar_id: str) -> str:
    return VENDOR_PREFIX_MAP.get(collar_id[:3], "Unknown")

# ── Data loaders ──────────────────────────────────────────────────────────────

def load_csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def parse_dt(s: str):
    s = s.strip()
    return datetime.strptime(s, "%Y-%m-%d %H:%M:%S") if s else None

# ── Main generation ───────────────────────────────────────────────────────────

DATA_END = datetime(2026, 7, 1)

def generate_all(deployments: list[dict], animals: dict[str, dict]) -> list[dict]:
    fix_id = 1
    rows: list[dict] = []

    for dep in deployments:
        collar_id  = dep["collar_id"]
        animal_id  = dep["animal_id"]
        interval_h = int(dep["fix_interval_hours"])
        start_dt   = parse_dt(dep["deploy_datetime"])
        end_dt     = parse_dt(dep["end_datetime"]) or DATA_END
        deploy_lat = float(dep["deploy_lat"])
        deploy_lon = float(dep["deploy_lon"])
        end_reason = dep["end_reason"].strip()

        animal     = animals[animal_id]
        species    = animal["species"]
        population = animal["population"]
        is_death   = "mortality" in end_reason

        params     = MOVEMENT_PARAMS[population]
        bounds     = BOUNDS[population]
        vendor     = collar_vendor(collar_id)

        cur_lat, cur_lon = deploy_lat, deploy_lon
        prev_dx, prev_dy = 0.0, 0.0

        # Initialise altitude in mid-range for the starting month
        start_month = start_dt.month
        is_summer = 4 <= start_month <= 9
        alt_key = "summer" if is_summer else "winter"
        lo, hi = ALT_RANGES[population][alt_key]
        cur_alt = float((lo + hi) // 2)

        dt = start_dt
        animal_rows: list[dict] = []

        while dt <= end_dt:
            tgt_lat, tgt_lon = get_seasonal_target(population, dt)
            dist  = haversine_km(cur_lat, cur_lon, tgt_lat, tgt_lon)
            skm   = step_km(population, dt, params)

            if animal_rows:  # don't move on the very first fix
                cur_lat, cur_lon, prev_dx, prev_dy = generate_step(
                    cur_lat, cur_lon, tgt_lat, tgt_lon, skm,
                    params["drift"], prev_dx, prev_dy, params["corr"]
                )
                cur_lat, cur_lon = clamp_to_bounds(cur_lat, cur_lon, bounds)

            cur_alt = update_altitude(cur_alt, population, dt.month)
            ft, sats = fix_type_and_sats()
            secs_to_end = (end_dt - dt).total_seconds()
            dying = is_death and secs_to_end < interval_h * 3600 * 2
            mort_flag = 1 if (is_death and secs_to_end < interval_h * 3600) else 0
            temp = seasonal_temperature(cur_lat, dt.month)

            animal_rows.append({
                "fix_id":          fix_id,
                "collar_id":       collar_id,
                "animal_id":       animal_id,
                "species":         species,
                "fix_datetime_utc": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "latitude":        round(cur_lat, 5),
                "longitude":       round(cur_lon, 5),
                "altitude_m":      cur_alt,
                "fix_type":        ft,
                "num_satellites":  sats,
                "dop":             dop_value(ft),
                "temperature_c":   temp,
                "activity_index":  activity_index(population, dt, dying),
                "mortality_flag":  mort_flag,
                "vendor":          vendor,
            })
            fix_id += 1
            dt += timedelta(hours=interval_h)

        rows.extend(animal_rows)
        print(f"  {animal_id:8s}  {population:35s}  {len(animal_rows):5d} fixes  "
              f"{start_dt.date()} → {end_dt.date()}")

    return rows

def write_csv(rows: list[dict], path: Path) -> None:
    fields = [
        "fix_id", "collar_id", "animal_id", "species", "fix_datetime_utc",
        "latitude", "longitude", "altitude_m", "fix_type", "num_satellites",
        "dop", "temperature_c", "activity_index", "mortality_flag", "vendor",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

def main():
    deps    = load_csv(DATA_DIR / "collar_deployments.csv")
    animals = {r["animal_id"]: r for r in load_csv(DATA_DIR / "animals.csv")}

    print(f"Generating telemetry for {len(deps)} collared animals …\n")
    rows = generate_all(deps, animals)

    out = DATA_DIR / "telemetry.csv"
    write_csv(rows, out)
    print(f"\n✓  Wrote {len(rows):,} fixes → {out}")

if __name__ == "__main__":
    main()
