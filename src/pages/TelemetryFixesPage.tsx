import { useCallback, useEffect, useMemo, useState } from 'react';

import { FabricRealtimeDashboard } from '@/components/FabricRealtimeDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Download from 'lucide-react/dist/esm/icons/download';
import { exportToCsv } from '@/lib/exportCsv';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pager } from '@/components/ui/pager';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { SortableHead } from '@/components/ui/sortable-head';
import { getAnimals, type AnimalItem } from '@/services/animals';
import { getCollarDeployments, type CollarDeploymentItem } from '@/services/collarDeployments';
import {
  getTelemetryFixesByDeployment, type TelemetryFixItem,
} from '@/services/telemetryFixes';

const TRACK_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
];


function formatDate(d: Date | string) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function TelemetryFixesPage() {
  const [fixes, setFixes] = useState<TelemetryFixItem[]>([]);
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [deployments, setDeployments] = useState<CollarDeploymentItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingFixes, setLoadingFixes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const { sorted: sortedFixes, sortKey: fixSortKey, sortDir: fixSortDir, toggleSort: toggleFixSort } = useSorting(fixes);
  const { page: fixPage, setPage: setFixPage, pageItems: pageFixes, pageCount: fixPageCount } = usePagination(sortedFixes);

  // Load animals + deployments on mount only
  const fetchMeta = useCallback(async () => {
    try {
      const [anims, deps] = await Promise.all([getAnimals(), getCollarDeployments()]);
      setAnimals(anims);
      setDeployments(deps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata.');
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => { void fetchMeta(); }, [fetchMeta]);

  // Load fixes only when a deployment is selected
  const handleSelectDeployment = useCallback(async (deploymentId: string) => {
    setSelectedDeployment(deploymentId);
    setFixes([]);
    setLoadingFixes(true);
    setError(null);
    try {
      const data = await getTelemetryFixesByDeployment(deploymentId);
      setFixes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry data.');
    } finally {
      setLoadingFixes(false);
    }
  }, []);

  // Deployments visible under the selected animal filter
  const visibleDeployments = useMemo(() =>
    selectedAnimal === 'all'
      ? deployments
      : deployments.filter(d => d.animal_id === selectedAnimal),
    [deployments, selectedAnimal],
  );

  const animalLabel = (id: string) => animals.find(a => a.id === id)?.animalId ?? id.slice(0, 8);

  const totalMortality = useMemo(() => fixes.filter(f => f.mortalityFlag).length, [fixes]);

  const handleExport = () => {
    exportToCsv('telemetry-fixes.csv', fixes.map(f => ({
      'Fix #': f.fixId,
      'Datetime (UTC)': new Date(f.fixDatetimeUtc).toISOString(),
      'Latitude': f.latitude,
      'Longitude': f.longitude,
      'Altitude (m)': f.altitudeM ?? '',
      'Fix Type': f.fixType,
      'Satellites': f.numSatellites ?? '',
      'DOP': f.dop ?? '',
      'Temp (C)': f.temperatureC ?? '',
      'Activity Index': f.activityIndex ?? '',
      'Mortality Flag': f.mortalityFlag ? 'Y' : 'N',
    })));
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Telemetry Fixes</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={fixes.length === 0}>
              <Download size={14} className="mr-1.5" /> Export CSV
            </Button>
            <Badge variant="outline" className="text-muted-foreground">Read-only</Badge>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {/* Animal filter */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by animal</span>
          <Select
            value={selectedAnimal}
            onValueChange={(v) => { setSelectedAnimal(v); setSelectedDeployment(null); setFixes([]); }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All animals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All animals</SelectItem>
              {animals.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collar deployment pills */}
        {loadingMeta ? (
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6">
            {visibleDeployments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deployments for this animal.</p>
            ) : (
              visibleDeployments.map((dep, i) => {
                const color = TRACK_COLORS[i % TRACK_COLORS.length];
                const isSelected = dep.id === selectedDeployment;
                return (
                  <button
                    key={dep.id}
                    onClick={() => void handleSelectDeployment(dep.id)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      backgroundColor: isSelected ? color : 'transparent',
                      borderColor: color,
                      color: isSelected ? '#fff' : color,
                    }}
                  >
                    {dep.collarId} · {animalLabel(dep.animal_id)}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* No deployment selected — prompt */}
        {!selectedDeployment && !loadingMeta && (
          <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border text-center">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Select a collar deployment above</p>
              <p className="text-xs text-muted-foreground">Its GPS track will appear here.</p>
            </div>
          </div>
        )}

        {/* Stats + map + table — only shown once a deployment is selected */}
        {selectedDeployment && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Fixes', value: loadingFixes ? '—' : fixes.length.toLocaleString() },
                { label: 'Mortality Flags', value: loadingFixes ? '—' : totalMortality },
                { label: 'Showing', value: loadingFixes ? '—' : fixes.length.toLocaleString() },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden mb-6">
              <FabricRealtimeDashboard title="Wildlife Telemetry Live" />
            </Card>

            {/* Fix log table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fix Log</CardTitle>
              </CardHeader>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHead label="Fix #" sortKey="fixId" currentKey={fixSortKey} dir={fixSortDir} onSort={toggleFixSort} />
                      <SortableHead label="Datetime (UTC)" sortKey="fixDatetimeUtc" currentKey={fixSortKey} dir={fixSortDir} onSort={toggleFixSort} />
                      <TableHead className="text-right">Lat</TableHead>
                      <TableHead className="text-right">Lon</TableHead>
                      <TableHead className="text-right">Alt (m)</TableHead>
                      <TableHead>Type</TableHead>
                      <SortableHead label="Sats" sortKey="numSatellites" currentKey={fixSortKey} dir={fixSortDir} onSort={toggleFixSort} className="text-right" />
                      <TableHead className="text-right">Temp °C</TableHead>
                      <SortableHead label="Mort." sortKey="mortalityFlag" currentKey={fixSortKey} dir={fixSortDir} onSort={toggleFixSort} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingFixes
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 9 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      : pageFixes.map((fix) => (
                          <TableRow key={fix.id} className={fix.mortalityFlag ? 'bg-destructive/5' : undefined}>
                            <TableCell className="font-mono text-xs">{fix.fixId}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{formatDate(fix.fixDatetimeUtc)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fix.latitude.toFixed(5)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fix.longitude.toFixed(5)}</TableCell>
                            <TableCell className="text-right text-xs">{fix.altitudeM ?? '—'}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{fix.fixType}</Badge></TableCell>
                            <TableCell className="text-right text-xs">{fix.numSatellites ?? '—'}</TableCell>
                            <TableCell className="text-right text-xs">{fix.temperatureC != null ? `${fix.temperatureC}°` : '—'}</TableCell>
                            <TableCell>{fix.mortalityFlag ? <Badge variant="destructive" className="text-xs">⚠</Badge> : '—'}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
                <Pager page={fixPage} pageCount={fixPageCount} onPageChange={setFixPage} />
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
