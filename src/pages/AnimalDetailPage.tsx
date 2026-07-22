import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CircleMarker, MapContainer, Polyline, TileLayer,
  Tooltip as LeafletTooltip,
} from 'react-leaflet';

import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Satellite from 'lucide-react/dist/esm/icons/satellite';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pager } from '@/components/ui/pager';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePagination } from '@/hooks/usePagination';
import {
  getAnimalById, updateAnimal, type AnimalItem,
} from '@/services/animals';
import { getCapturesByAnimal, type CaptureItem } from '@/services/captures';
import {
  getCollarDeploymentsByAnimal, type CollarDeploymentItem,
} from '@/services/collarDeployments';
import { getCollarModels, type CollarModelItem } from '@/services/collarModels';
import { getPersonnel, type PersonnelItem } from '@/services/personnel';
import { getSpecies, type SpeciesItem } from '@/services/species';
import { getStudyAreas, type StudyAreaItem } from '@/services/studyAreas';
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

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  alive: 'default',
  mortality: 'destructive',
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(d: Date | string | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const emptyForm = {
  animalId: '', sex: '', ageClass: '', estAgeYears: undefined as number | undefined,
  earTagId: '', currentStatus: 'alive', mortalityCause: undefined as string | undefined,
  createdAt: new Date(), species_id: '', studyArea_id: '',
};

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [animal, setAnimal] = useState<AnimalItem | null>(null);
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [deployments, setDeployments] = useState<CollarDeploymentItem[]>([]);
  const [speciesList, setSpeciesList] = useState<SpeciesItem[]>([]);
  const [studyAreaList, setStudyAreaList] = useState<StudyAreaItem[]>([]);
  const [collarModels, setCollarModels] = useState<CollarModelItem[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Telemetry
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [fixes, setFixes] = useState<TelemetryFixItem[]>([]);
  const [loadingFixes, setLoadingFixes] = useState(false);

  const { page: capPage, setPage: setCapPage, pageItems: capItems, pageCount: capPageCount } =
    usePagination(captures);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [a, caps, deps, sp, sa, cms, pers] = await Promise.all([
        getAnimalById(id),
        getCapturesByAnimal(id),
        getCollarDeploymentsByAnimal(id),
        getSpecies(),
        getStudyAreas(),
        getCollarModels(),
        getPersonnel(),
      ]);
      if (!a) { setError('Animal not found.'); return; }
      setAnimal(a);
      setCaptures(caps);
      setDeployments(deps);
      setSpeciesList(sp);
      setStudyAreaList(sa);
      setCollarModels(cms);
      setPersonnel(pers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleSelectDeployment = useCallback(async (depId: string) => {
    if (depId === selectedDeployment) {
      setSelectedDeployment(null);
      setFixes([]);
      return;
    }
    setSelectedDeployment(depId);
    setFixes([]);
    setLoadingFixes(true);
    try {
      const data = await getTelemetryFixesByDeployment(depId);
      setFixes(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load telemetry.');
    } finally {
      setLoadingFixes(false);
    }
  }, [selectedDeployment]);

  const handleEdit = () => {
    if (!animal) return;
    setForm({
      animalId: animal.animalId,
      sex: animal.sex,
      ageClass: animal.ageClass,
      estAgeYears: animal.estAgeYears,
      earTagId: animal.earTagId,
      currentStatus: animal.currentStatus,
      mortalityCause: animal.mortalityCause,
      createdAt: animal.createdAt,
      species_id: animal.species_id,
      studyArea_id: animal.studyArea_id,
    });
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await updateAnimal(id, form);
      await fetchAll();
      setSheetOpen(false);
      toast.success('Animal updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const speciesName = (sid: string) => speciesList.find(s => s.id === sid)?.commonName ?? '—';
  const studyAreaName = (sid: string) => studyAreaList.find(s => s.id === sid)?.population ?? '—';
  const collarModelName = (cmid: string) => {
    const cm = collarModels.find(c => c.id === cmid);
    return cm ? `${cm.vendor} ${cm.model}` : '—';
  };
  const biologistName = (pid: string) => personnel.find(p => p.id === pid)?.name ?? '—';

  const mapCenter = useMemo<[number, number]>(() => {
    if (fixes.length === 0) return [64, -153];
    const lats = fixes.map(f => f.latitude);
    const lons = fixes.map(f => f.longitude);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lons) + Math.max(...lons)) / 2,
    ];
  }, [fixes]);

  const positions = useMemo<[number, number][]>(
    () => fixes.map(f => [f.latitude, f.longitude]),
    [fixes],
  );

  const trackColor =
    TRACK_COLORS[deployments.findIndex(d => d.id === selectedDeployment) % TRACK_COLORS.length]
    ?? TRACK_COLORS[0];

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </main>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="bg-background min-h-screen">
        <main className="max-w-5xl mx-auto px-4 py-10">
          <Link to="/animals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={14} /> Animals
          </Link>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error ?? 'Animal not found.'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-6">
          <Link
            to="/animals"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft size={14} /> Animals
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">
              {animal.animalId}
              <span className="text-muted-foreground font-normal ml-2 text-lg">· {animal.earTagId}</span>
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={STATUS_VARIANTS[animal.currentStatus] ?? 'outline'} className="capitalize">
                {animal.currentStatus}
              </Badge>
              <Button size="sm" variant="outline" onClick={handleEdit}>Edit</Button>
            </div>
          </div>
        </div>

        {/* Bio cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Species', value: speciesName(animal.species_id) },
            { label: 'Population', value: studyAreaName(animal.studyArea_id) },
            {
              label: 'Sex',
              value: animal.sex === 'F' ? 'Female' : animal.sex === 'M' ? 'Male' : 'Unknown',
            },
            {
              label: 'Age Class',
              value: animal.ageClass
                ? animal.ageClass.charAt(0).toUpperCase() + animal.ageClass.slice(1)
                : '—',
            },
            {
              label: 'Est. Age',
              value: animal.estAgeYears != null ? `${animal.estAgeYears} yr` : '—',
            },
            { label: 'Enrolled', value: formatDateShort(animal.createdAt) },
          ].map(card => (
            <Card key={card.label}>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{card.label}</p>
                <p className="font-semibold text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          ))}
          {animal.currentStatus === 'mortality' && animal.mortalityCause && (
            <Card className="border-destructive/40 sm:col-span-3">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Mortality Cause</p>
                <p className="font-semibold text-destructive">{animal.mortalityCause}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Collar Deployments */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Satellite size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Collar Deployments</h2>
            <span className="text-xs text-muted-foreground">({deployments.length})</span>
          </div>
          {deployments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collar deployments for this animal.</p>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collar ID</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Fix Interval</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((dep, i) => {
                    const isActive = !dep.endDatetime;
                    const isSelected = dep.id === selectedDeployment;
                    const color = TRACK_COLORS[i % TRACK_COLORS.length];
                    return (
                      <TableRow key={dep.id} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{dep.collarId}</TableCell>
                        <TableCell>{collarModelName(dep.collarModel_id)}</TableCell>
                        <TableCell>{formatDateShort(dep.deployDatetime)}</TableCell>
                        <TableCell>
                          {isActive
                            ? <Badge variant="default">Active</Badge>
                            : formatDateShort(dep.endDatetime)}
                        </TableCell>
                        <TableCell>{dep.fixIntervalHours}h</TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => void handleSelectDeployment(dep.id)}
                            className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                            style={{
                              backgroundColor: isSelected ? color : 'transparent',
                              borderColor: color,
                              color: isSelected ? '#fff' : color,
                            }}
                          >
                            {isSelected ? 'Hide track' : 'View track'}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </section>

        {/* Telemetry map */}
        {selectedDeployment && (
          <section className="mb-8">
            {loadingFixes ? (
              <Skeleton className="w-full h-[440px] rounded-xl" />
            ) : (
              <>
                <Card className="overflow-hidden mb-3 relative">
                  <MapContainer
                    key={selectedDeployment}
                    center={mapCenter}
                    zoom={7}
                    style={{ height: '440px', width: '100%' }}
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
                          <LeafletTooltip>Start · {formatDate(fixes[0].fixDatetimeUtc)}</LeafletTooltip>
                        </CircleMarker>
                        {fixes.filter(f => f.mortalityFlag).map(f => (
                          <CircleMarker
                            key={f.id}
                            center={[f.latitude, f.longitude]}
                            radius={7}
                            pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
                          >
                            <LeafletTooltip>⚠ Mortality · Fix #{f.fixId}</LeafletTooltip>
                          </CircleMarker>
                        ))}
                        <CircleMarker
                          center={positions[positions.length - 1]}
                          radius={5}
                          pathOptions={{ color: trackColor, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
                        >
                          <LeafletTooltip>
                            Last fix · {formatDate(fixes[fixes.length - 1].fixDatetimeUtc)}
                          </LeafletTooltip>
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
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
                  <span className="ml-auto tabular-nums">{fixes.length.toLocaleString()} fixes</span>
                </div>
              </>
            )}
          </section>
        )}

        {/* Captures */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Captures</h2>
            <span className="text-xs text-muted-foreground">({captures.length})</span>
          </div>
          {captures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No capture events recorded for this animal.</p>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capture ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>BCS</TableHead>
                    <TableHead>Biologist</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capItems.map(cap => (
                    <TableRow key={cap.id}>
                      <TableCell className="font-medium">{cap.captureId}</TableCell>
                      <TableCell>{formatDateShort(cap.captureDatetime)}</TableCell>
                      <TableCell>{cap.captureMethod}</TableCell>
                      <TableCell>{cap.bodyWeightKg ?? '—'}</TableCell>
                      <TableCell>{cap.bodyConditionScore ?? '—'}</TableCell>
                      <TableCell>{biologistName(cap.biologist_id)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager page={capPage} pageCount={capPageCount} onPageChange={setCapPage} />
            </Card>
          )}
        </section>

      </main>

      {/* Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Animal</SheetTitle>
          </SheetHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Animal ID</Label>
                <Input required placeholder="e.g. CAR-001" value={form.animalId}
                  onChange={(e) => setForm({ ...form, animalId: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Ear Tag ID</Label>
                <Input required placeholder="e.g. AK-31105" value={form.earTagId}
                  onChange={(e) => setForm({ ...form, earTagId: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Sex</Label>
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="U">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Age Class</Label>
                <Select value={form.ageClass} onValueChange={(v) => setForm({ ...form, ageClass: v })}>
                  <SelectTrigger><SelectValue placeholder="Select age class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="subadult">Subadult</SelectItem>
                    <SelectItem value="yearling">Yearling</SelectItem>
                    <SelectItem value="calf">Calf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Est. Age (years)</Label>
                <Input type="number" step="0.1" min="0" placeholder="5.2"
                  value={form.estAgeYears ?? ''}
                  onChange={(e) => setForm({
                    ...form,
                    estAgeYears: e.target.value ? parseFloat(e.target.value) : undefined,
                  })} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.currentStatus} onValueChange={(v) => setForm({ ...form, currentStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alive">Alive</SelectItem>
                    <SelectItem value="mortality">Mortality</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Species</Label>
                <Select value={form.species_id} onValueChange={(v) => setForm({ ...form, species_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                  <SelectContent>
                    {speciesList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.commonName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Study Area / Population</Label>
                <Select value={form.studyArea_id} onValueChange={(v) => setForm({ ...form, studyArea_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select study area" /></SelectTrigger>
                  <SelectContent>
                    {studyAreaList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.population}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.currentStatus === 'mortality' && (
                <div className="space-y-1 col-span-2">
                  <Label>Mortality Cause</Label>
                  <Input placeholder="e.g. predation" value={form.mortalityCause ?? ''}
                    onChange={(e) => setForm({ ...form, mortalityCause: e.target.value || undefined })} />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
