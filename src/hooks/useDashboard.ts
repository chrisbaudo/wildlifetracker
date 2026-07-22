import { useEffect, useState } from 'react';

import { getAnimals } from '@/services/animals';
import { getCaptures } from '@/services/captures';
import { getCollarDeployments } from '@/services/collarDeployments';
import { getSpecies } from '@/services/species';
import { getStudyAreas } from '@/services/studyAreas';
import { getLastFixByDeployment, type TelemetryFixItem } from '@/services/telemetryFixes';

export interface DashboardStats {
  totalAnimals: number;
  activeAnimals: number;
  collaredAnimals: number;
  recentCaptures: number;
  mortalityCount: number;
}

export interface AlertItem {
  id: string;
  type: 'mortality' | 'unmonitored';
  animalId: string;
  earTagId: string;
  speciesName: string;
  detail: string;
}

export interface ActivityItem {
  id: string;
  label: string;
  sub: string;
  date: Date;
}

export interface CountEntry {
  name: string;
  count: number;
}

export interface MonthlyCapture {
  month: string;
  count: number;
}

export interface LastKnownPosition {
  deploymentId: string;
  animalId: string;
  animalLabel: string;
  earTagId: string;
  speciesName: string;
  status: string;
  fix: TelemetryFixItem;
}

export interface DashboardData {
  stats: DashboardStats;
  alerts: AlertItem[];
  activity: ActivityItem[];
  bySpecies: CountEntry[];
  byStudyArea: CountEntry[];
  capturesByMonth: MonthlyCapture[];
  lastKnownPositions: LastKnownPosition[];
  loadingPositions: boolean;
  loading: boolean;
  error: string | null;
}

const EMPTY_STATS: DashboardStats = {
  totalAnimals: 0,
  activeAnimals: 0,
  collaredAnimals: 0,
  recentCaptures: 0,
  mortalityCount: 0,
};

export function useDashboard(): DashboardData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [bySpecies, setBySpecies] = useState<CountEntry[]>([]);
  const [byStudyArea, setByStudyArea] = useState<CountEntry[]>([]);
  const [capturesByMonth, setCapturesByMonth] = useState<MonthlyCapture[]>([]);
  const [lastKnownPositions, setLastKnownPositions] = useState<LastKnownPosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getAnimals(),
      getCollarDeployments(),
      getCaptures(),
      getSpecies(),
      getStudyAreas(),
    ])
      .then(([animals, deployments, captures, species, studyAreas]) => {
        if (cancelled) return;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const speciesMap = new Map(species.map(s => [s.id, s.commonName]));
        const studyAreaMap = new Map(studyAreas.map(a => [a.id, a.studyArea]));
        const animalMap = new Map(animals.map(a => [a.id, a]));

        const activeDeployments = deployments.filter(d => !d.endDatetime);
        const collaredAnimalIds = new Set(activeDeployments.map(d => d.animal_id));

        const activeAnimals = animals.filter(a => a.currentStatus.toLowerCase() === 'active');
        const mortalityAnimals = animals.filter(a => a.currentStatus.toLowerCase() === 'mortality');
        const recentCaptureCount = captures.filter(
          c => new Date(c.captureDatetime) >= thirtyDaysAgo
        ).length;

        setStats({
          totalAnimals: animals.length,
          activeAnimals: activeAnimals.length,
          collaredAnimals: collaredAnimalIds.size,
          recentCaptures: recentCaptureCount,
          mortalityCount: mortalityAnimals.length,
        });

        // Alerts: mortality animals (up to 10) then unmonitored active animals (up to 10)
        const newAlerts: AlertItem[] = [];
        for (const a of mortalityAnimals.slice(0, 10)) {
          newAlerts.push({
            id: `mortality-${a.id}`,
            type: 'mortality',
            animalId: a.animalId,
            earTagId: a.earTagId,
            speciesName: speciesMap.get(a.species_id) ?? 'Unknown',
            detail: a.mortalityCause ?? 'Cause unknown',
          });
        }
        for (const a of activeAnimals.filter(a => !collaredAnimalIds.has(a.id)).slice(0, 10)) {
          newAlerts.push({
            id: `unmonitored-${a.id}`,
            type: 'unmonitored',
            animalId: a.animalId,
            earTagId: a.earTagId,
            speciesName: speciesMap.get(a.species_id) ?? 'Unknown',
            detail: 'No active collar deployment',
          });
        }
        setAlerts(newAlerts);

        // Activity: most recent 5 captures (service returns desc by captureDatetime)
        setActivity(
          captures.slice(0, 5).map(c => {
            const animal = animalMap.get(c.animal_id);
            return {
              id: c.id,
              label: animal ? `${animal.animalId} (${animal.earTagId})` : c.captureId,
              sub: c.captureMethod,
              date: new Date(c.captureDatetime),
            };
          })
        );

        // Animals by species (top 8)
        const speciesCounts = new Map<string, number>();
        for (const a of animals) {
          speciesCounts.set(a.species_id, (speciesCounts.get(a.species_id) ?? 0) + 1);
        }
        setBySpecies(
          [...speciesCounts.entries()]
            .map(([id, count]) => ({ name: speciesMap.get(id) ?? id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
        );

        // Animals by study area (top 8)
        const studyAreaCounts = new Map<string, number>();
        for (const a of animals) {
          studyAreaCounts.set(a.studyArea_id, (studyAreaCounts.get(a.studyArea_id) ?? 0) + 1);
        }
        setByStudyArea(
          [...studyAreaCounts.entries()]
            .map(([id, count]) => ({ name: studyAreaMap.get(id) ?? id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
        );

        // Captures by month (last 6 months)
        const monthKeys: string[] = [];
        const monthLabels: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthKeys.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          );
          monthLabels.push(d.toLocaleString('default', { month: 'short' }));
        }
        const monthCounts = new Map<string, number>(monthKeys.map(k => [k, 0]));
        for (const c of captures) {
          const d = new Date(c.captureDatetime);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (monthCounts.has(key)) monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
        }
        setCapturesByMonth(monthKeys.map((key, i) => ({ month: monthLabels[i], count: monthCounts.get(key) ?? 0 })));

        // Kick off last-fix fetches for active deployments (fire-and-forget)
        const activeDeps = deployments.filter(d => !d.endDatetime).slice(0, 30);
        if (activeDeps.length === 0) {
          setLoadingPositions(false);
          return;
        }
        void Promise.all(
          activeDeps.map(dep =>
            getLastFixByDeployment(dep.id)
              .then(fix => fix ? { dep, fix } : null)
              .catch(() => null)
          )
        ).then(results => {
          if (cancelled) return;
          setLastKnownPositions(
            results
              .flatMap(r => r ? [r] : [])
              .map(({ dep, fix }) => {
                const animal = animalMap.get(dep.animal_id);
                return {
                  deploymentId: dep.id,
                  animalId: dep.animal_id,
                  animalLabel: animal?.animalId ?? dep.animal_id.slice(0, 8),
                  earTagId: animal?.earTagId ?? '',
                  speciesName: speciesMap.get(animal?.species_id ?? '') ?? 'Unknown',
                  status: animal?.currentStatus ?? 'unknown',
                  fix,
                };
              })
          );
          setLoadingPositions(false);
        }).catch(() => {
          if (!cancelled) setLoadingPositions(false);
        });
      })
      .catch(err => {
        if (!cancelled) { setError(String(err)); setLoadingPositions(false); }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { stats, alerts, activity, bySpecies, byStudyArea, capturesByMonth, lastKnownPositions, loadingPositions, loading, error };
}
