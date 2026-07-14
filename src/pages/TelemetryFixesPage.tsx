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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  getTelemetryFixes, type TelemetryFixItem,
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

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function TelemetryFixesPage() {
  const [fixes, setFixes] = useState<TelemetryFixItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);

  const fetchFixes = useCallback(async () => {
    setError(null);
    try {
      const data = await getTelemetryFixes();
      setFixes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchFixes(); }, [fetchFixes]);

  // Group fixes by collarDeployment_id, maintain time order
  const grouped = useMemo(() => {
    const map = new Map<string, TelemetryFixItem[]>();
    for (const fix of fixes) {
      const key = fix.collarDeployment_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(fix);
    }
    return map;
  }, [fixes]);

  const deploymentIds = useMemo(() => [...grouped.keys()], [grouped]);

  const visibleFixes = useMemo(() => {
    if (!selectedDeployment) return fixes;
    return grouped.get(selectedDeployment) ?? [];
  }, [fixes, grouped, selectedDeployment]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (fixes.length === 0) return [64, -153]; // Alaska center
    const lats = fixes.map(f => f.latitude);
    const lons = fixes.map(f => f.longitude);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lons) + Math.max(...lons)) / 2,
    ];
  }, [fixes]);

  const totalMortality = useMemo(() => fixes.filter(f => f.mortalityFlag).length, [fixes]);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Telemetry Fixes</h1>
          <Badge variant="outline" className="text-muted-foreground">Read-only</Badge>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Fixes', value: loading ? '—' : fixes.length.toLocaleString() },
            { label: 'Collars', value: loading ? '—' : deploymentIds.length },
            { label: 'Mortality Flags', value: loading ? '—' : totalMortality },
            { label: 'Showing', value: loading ? '—' : visibleFixes.length.toLocaleString() },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Collar filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedDeployment(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              selectedDeployment === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary'
            }`}
          >
            All collars
          </button>
          {deploymentIds.map((id, i) => (
            <button
              key={id}
              onClick={() => setSelectedDeployment(id === selectedDeployment ? null : id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors`}
              style={{
                backgroundColor: id === selectedDeployment ? TRACK_COLORS[i % TRACK_COLORS.length] : 'transparent',
                borderColor: TRACK_COLORS[i % TRACK_COLORS.length],
                color: id === selectedDeployment ? '#fff' : TRACK_COLORS[i % TRACK_COLORS.length],
              }}
            >
              {shortId(id)}
            </button>
          ))}
        </div>

        {/* Map */}
        {loading ? (
          <Skeleton className="w-full h-[520px] rounded-xl mb-6" />
        ) : (
          <Card className="overflow-hidden mb-6 relative">
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: '520px', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {deploymentIds.map((deploymentId, i) => {
                if (selectedDeployment && selectedDeployment !== deploymentId) return null;
                const track = grouped.get(deploymentId)!;
                const color = TRACK_COLORS[i % TRACK_COLORS.length];
                const positions: [number, number][] = track.map(f => [f.latitude, f.longitude]);

                return (
                  <span key={deploymentId}>
                    {/* Track line */}
                    <Polyline positions={positions} color={color} weight={2} opacity={0.8} />

                    {/* Start marker */}
                    <CircleMarker
                      center={positions[0]}
                      radius={6}
                      pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 2 }}
                    >
                      <Tooltip permanent={false}>
                        Start · {shortId(deploymentId)}<br />
                        {formatDate(track[0].fixDatetimeUtc)}
                      </Tooltip>
                    </CircleMarker>

                    {/* Mortality flag fixes */}
                    {track.filter(f => f.mortalityFlag).map(f => (
                      <CircleMarker
                        key={f.id}
                        center={[f.latitude, f.longitude]}
                        radius={7}
                        pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
                      >
                        <Tooltip>⚠ Mortality · Fix #{f.fixId}<br />{formatDate(f.fixDatetimeUtc)}</Tooltip>
                      </CircleMarker>
                    ))}

                    {/* Last known position */}
                    <CircleMarker
                      center={positions[positions.length - 1]}
                      radius={5}
                      pathOptions={{ color: color, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
                    >
                      <Tooltip>
                        Last fix · {shortId(deploymentId)}<br />
                        {formatDate(track[track.length - 1].fixDatetimeUtc)}
                      </Tooltip>
                    </CircleMarker>
                  </span>
                );
              })}
            </MapContainer>

            {/* Empty state overlay on map */}
            {fixes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl px-6 py-4 text-center shadow-lg">
                  <p className="text-sm font-medium text-foreground">No telemetry data yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run the <code className="font-mono bg-muted px-1 rounded">6-INSERT INTO TelemetryFixes</code> script to seed GPS fixes.
                  </p>
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

        {/* Read-only table */}
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
                  <TableHead>Collar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : visibleFixes.map((fix) => (
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
                        <TableCell className="font-mono text-xs text-muted-foreground">{shortId(fix.collarDeployment_id)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
