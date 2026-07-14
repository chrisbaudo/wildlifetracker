import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getAnimals, type AnimalItem } from '@/services/animals';
import {
  createCapture, deleteCapture, getCaptures, updateCapture, type CaptureItem,
} from '@/services/captures';
import { getCollarDeployments, type CollarDeploymentItem } from '@/services/collarDeployments';
import { getPersonnel, type PersonnelItem } from '@/services/personnel';

function toDatetimeLocal(d: Date | string | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 16);
}

const emptyForm: Omit<CaptureItem, 'id'> = {
  captureId: '', captureDatetime: new Date(),
  captureLat: 0, captureLon: 0,
  bodyWeightKg: undefined, chestGirthCm: undefined, bodyConditionScore: undefined,
  captureMethod: '', immobilizationDrug: undefined,
  drugDoseMl: undefined, inductionMin: undefined, handlingTimeMin: undefined,
  bloodSample: false, fecalSample: false, hairSample: false, toothExtracted: false,
  notes: undefined, animal_id: '', biologist_id: '', pilot_id: '',
  collarDeployment_id: undefined,
};

export function CapturesPage() {
  const [items, setItems] = useState<CaptureItem[]>([]);
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [deployments, setDeployments] = useState<CollarDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CaptureItem, 'id'>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [caps, anims, pers, deps] = await Promise.all([
        getCaptures(), getAnimals(), getPersonnel(), getCollarDeployments(),
      ]);
      setItems(caps);
      setAnimals(anims);
      setPersonnel(pers);
      setDeployments(deps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await updateCapture(editingId, form); setEditingId(null); }
    else { await createCapture(form); }
    setForm(emptyForm);
    await fetchAll();
  };

  const handleEdit = (item: CaptureItem) => {
    setEditingId(item.id);
    const { id: _id, ...rest } = item;
    setForm({ ...rest, captureDatetime: new Date(item.captureDatetime) });
  };

  const animalLabel = (id: string | undefined) =>
    id ? (animals.find(a => a.id === id)?.animalId ?? id.slice(0, 8)) : '—';
  const personnelLabel = (id: string | undefined) =>
    id ? (personnel.find(p => p.id === id)?.name ?? id.slice(0, 8)) : '—';
  const deploymentLabel = (id?: string) => id ? (deployments.find(d => d.id === id)?.collarId ?? id.slice(0, 8)) : '—';

  const sampleFlags = [
    { key: 'bloodSample' as const, label: 'Blood' },
    { key: 'fecalSample' as const, label: 'Fecal' },
    { key: 'hairSample' as const, label: 'Hair' },
    { key: 'toothExtracted' as const, label: 'Tooth' },
  ];

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Captures</h1>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Capture' : 'Log Capture'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              {/* Identity & Location */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Identity & Location</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Capture ID</Label>
                    <Input required placeholder="e.g. CAP-2025-0001" value={form.captureId}
                      onChange={(e) => setForm({ ...form, captureId: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Animal</Label>
                    <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                      <SelectContent>{animals.map(a => <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Capture Datetime</Label>
                    <Input required type="datetime-local" value={toDatetimeLocal(form.captureDatetime)}
                      onChange={(e) => setForm({ ...form, captureDatetime: new Date(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Collar Deployment</Label>
                    <Select value={form.collarDeployment_id ?? 'none'}
                      onValueChange={(v) => setForm({ ...form, collarDeployment_id: v === 'none' ? undefined : v })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {deployments.map(d => <SelectItem key={d.id} value={d.id}>{d.collarId}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Latitude</Label>
                    <Input required type="number" step="any" placeholder="67.75182" value={form.captureLat || ''}
                      onChange={(e) => setForm({ ...form, captureLat: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Longitude</Label>
                    <Input required type="number" step="any" placeholder="-159.05526" value={form.captureLon || ''}
                      onChange={(e) => setForm({ ...form, captureLon: parseFloat(e.target.value) })} />
                  </div>
                </div>
              </div>

              {/* Biometrics */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Biometrics</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Body Weight (kg)</Label>
                    <Input type="number" step="0.1" placeholder="110.9" value={form.bodyWeightKg ?? ''}
                      onChange={(e) => setForm({ ...form, bodyWeightKg: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Chest Girth (cm)</Label>
                    <Input type="number" step="0.1" placeholder="113.6" value={form.chestGirthCm ?? ''}
                      onChange={(e) => setForm({ ...form, chestGirthCm: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Body Condition (1–5)</Label>
                    <Input type="number" step="0.5" min={1} max={5} placeholder="3.0" value={form.bodyConditionScore ?? ''}
                      onChange={(e) => setForm({ ...form, bodyConditionScore: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>
                </div>
              </div>

              {/* Capture Method */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Capture Method</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Method</Label>
                    <Select value={form.captureMethod} onValueChange={(v) => setForm({ ...form, captureMethod: v })}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Helicopter darting">Helicopter darting</SelectItem>
                        <SelectItem value="Helicopter net-gun">Helicopter net-gun</SelectItem>
                        <SelectItem value="Ground snare">Ground snare</SelectItem>
                        <SelectItem value="Clover trap">Clover trap</SelectItem>
                        <SelectItem value="Drop net">Drop net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Immobilization Drug</Label>
                    <Input placeholder="e.g. BAM" value={form.immobilizationDrug ?? ''}
                      onChange={(e) => setForm({ ...form, immobilizationDrug: e.target.value || undefined })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Drug Dose (mL)</Label>
                    <Input type="number" step="0.1" placeholder="2.1" value={form.drugDoseMl ?? ''}
                      onChange={(e) => setForm({ ...form, drugDoseMl: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Induction (min)</Label>
                    <Input type="number" min={0} placeholder="9" value={form.inductionMin ?? ''}
                      onChange={(e) => setForm({ ...form, inductionMin: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Handling Time (min)</Label>
                    <Input type="number" min={0} placeholder="26" value={form.handlingTimeMin ?? ''}
                      onChange={(e) => setForm({ ...form, handlingTimeMin: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
                  </div>
                </div>
              </div>

              {/* Samples */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Samples Collected</p>
                <div className="flex flex-wrap gap-6">
                  {sampleFlags.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={key}
                        checked={form[key] as boolean}
                        onCheckedChange={(v) => setForm({ ...form, [key]: !!v })}
                      />
                      <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personnel */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personnel</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Biologist</Label>
                    <Select value={form.biologist_id} onValueChange={(v) => setForm({ ...form, biologist_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select biologist" /></SelectTrigger>
                      <SelectContent>{personnel.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Pilot</Label>
                    <Select value={form.pilot_id} onValueChange={(v) => setForm({ ...form, pilot_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select pilot" /></SelectTrigger>
                      <SelectContent>{personnel.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label>Notes</Label>
                <Input placeholder="Optional field notes" value={form.notes ?? ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })} />
              </div>

              <div className="flex gap-3">
                <Button type="submit">{editingId ? 'Save Changes' : 'Log Capture'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {loading ? (
          <Card><Table><TableHeader><TableRow>
            {['ID','Animal','Date','Method','Biologist','Pilot','Collar','Samples',''].map(h => <TableHead key={h}>{h}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>{Array.from({length:4}).map((_,i) => <TableRow key={i}>
            {Array.from({length:9}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}
          </TableRow>)}</TableBody></Table></Card>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No captures logged yet.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capture ID</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Biologist</TableHead>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Collar</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm font-medium">{item.captureId}</TableCell>
                    <TableCell><Badge variant="secondary">{animalLabel(item.animal_id)}</Badge></TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(item.captureDatetime).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">{item.captureMethod}</TableCell>
                    <TableCell className="text-sm">{personnelLabel(item.biologist_id)}</TableCell>
                    <TableCell className="text-sm">{personnelLabel(item.pilot_id)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {deploymentLabel(item.collarDeployment_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.bloodSample && <Badge variant="outline" className="text-xs px-1">B</Badge>}
                        {item.fecalSample && <Badge variant="outline" className="text-xs px-1">F</Badge>}
                        {item.hairSample && <Badge variant="outline" className="text-xs px-1">H</Badge>}
                        {item.toothExtracted && <Badge variant="outline" className="text-xs px-1">T</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => void deleteCapture(item.id).then(fetchAll)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
