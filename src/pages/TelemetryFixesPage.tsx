import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from 'react-leaflet';

import { Badge } from '@/components/ui/badge';
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
import { getAnimals, type AnimalItem } from '@/services/animals';
import { getCollarDeployments, type CollarDeploymentItem } from '@/services/collarDeployments';
import {
  getTelemetryFixesByDeployment, type TelemetryFixItem,
} from '@/services/telemetryFixes';

// Fix Leaflet default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  const { page: fixPage, setPage: setFixPage, pageItems: pageFixes, pageCount: fixPageCount } = usePagination(fixes);

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

  const mapCenter = useMemo<[number, number]>(() => {
    if (fixes.length === 0) return [64, -153];
    const lats = fixes.map(f => f.latitude);
    const lons = fixes.map(f => f.longitude);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lons) + Math.max(...lons)) / 2,
    ];
  }, [fixes]);

  const totalMortality = useMemo(() => fixes.filter(f => f.mortalityFlag).length, [fixes]);
  const trackColor = TRACK_COLORS[
    visibleDeployments.findIndex(d => d.id === selectedDeployment) % TRACK_COLORS.length
  ] ?? TRACK_COLORS[0];
  const positions = useMemo<[number, number][]>(() => fixes.map(f => [f.latitude, f.longitude]), [fixes]);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Telemetry Fixes</h1>
          <Badge variant="outline" className="text-muted-foreground">Read-only</Badge>
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

            {/* Map */}
            {loadingFixes ? (
              <Skeleton className="w-full h-[520px] rounded-xl mb-6" />
            ) : (
              <Card className="overflow-hidden mb-6 relative">
                <MapContainer
                  key={selectedDeployment}
                  center={mapCenter}
                  zoom={7}
                  style={{ height: '520px', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {fixes.length > 0 && (
                    <>
                      <Polyline positions={positions} color={trackColor} weight={2} opacity={0.8} />

                      <CircleMarker
                        center={positions[0]}
                        radius={6}
                        pathOptions={{ color: '#fff', fillColor: trackColor, fillOpacity: 1, weight: 2 }}
                      >
                        <Tooltip>Start · {formatDate(fixes[0].fixDatetimeUtc)}</Tooltip>
                      </CircleMarker>

                      {fixes.filter(f => f.mortalityFlag).map(f => (
                        <CircleMarker
                          key={f.id}
                          center={[f.latitude, f.longitude]}
                          radius={7}
                          pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
                        >
                          <Tooltip>⚠ Mortality · Fix #{f.fixId}<br />{formatDate(f.fixDatetimeUtc)}</Tooltip>
                        </CircleMarker>
                      ))}

                      <CircleMarker
                        center={positions[positions.length - 1]}
                        radius={5}
                        pathOptions={{ color: trackColor, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
                      >
                        <Tooltip>Last fix · {formatDate(fixes[fixes.length - 1].fixDatetimeUtc)}</Tooltip>
                      </CircleMarker>
                    </>
                  )}
                </MapContainer>

                {fixes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
                    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl px-6 py-4 text-center shadow-lg">
                      <p className="text-sm font-medium text-foreground">No fixes for this deployment</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-primary border-2 border-white" />
                Start
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-white border-2 border-primary" />
                Last fix
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                Mortality flag
              </span>
            </div>

            {/* Fix log table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fix Log</CardTitle>
              </CardHeader>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fix #</TableHead>
                      <TableHead>Datetime (UTC)</TableHead>
                      <TableHead className="text-right">Lat</TableHead>
                      <TableHead className="text-right">Lon</TableHead>
                      <TableHead className="text-right">Alt (m)</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Sats</TableHead>
                      <TableHead className="text-right">Temp °C</TableHead>
                      <TableHead>Mort.</TableHead>
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
