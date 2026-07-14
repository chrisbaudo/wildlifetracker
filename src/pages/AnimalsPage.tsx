import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  createAnimal, deleteAnimal, getAnimals, updateAnimal, type AnimalItem,
} from '@/services/animals';
import { getSpecies, type SpeciesItem } from '@/services/species';
import { getStudyAreas, type StudyAreaItem } from '@/services/studyAreas';

const emptyForm = {
  animalId: '', sex: '', ageClass: '', estAgeYears: undefined as number | undefined,
  earTagId: '', currentStatus: 'alive', mortalityCause: undefined as string | undefined,
  createdAt: new Date(), species_id: '', studyArea_id: '',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  alive: 'default',
  mortality: 'destructive',
};

export function AnimalsPage() {
  const [items, setItems] = useState<AnimalItem[]>([]);
  const [speciesList, setSpeciesList] = useState<SpeciesItem[]>([]);
  const [studyAreaList, setStudyAreaList] = useState<StudyAreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setError(null);
    try {
      const [animals, sp, sa] = await Promise.all([getAnimals(), getSpecies(), getStudyAreas()]);
      setItems(animals);
      setSpeciesList(sp);
      setStudyAreaList(sa);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, createdAt: form.createdAt ?? new Date() };
    if (editingId) { await updateAnimal(editingId, data); setEditingId(null); }
    else { await createAnimal(data); }
    setForm(emptyForm);
    await fetchItems();
  };

  const handleEdit = (item: AnimalItem) => {
    setEditingId(item.id);
    setForm({
      animalId: item.animalId, sex: item.sex, ageClass: item.ageClass,
      estAgeYears: item.estAgeYears, earTagId: item.earTagId,
      currentStatus: item.currentStatus, mortalityCause: item.mortalityCause,
      createdAt: item.createdAt, species_id: item.species_id, studyArea_id: item.studyArea_id,
    });
  };

  const speciesName = (id: string | undefined) => id ? (speciesList.find(s => s.id === id)?.commonName ?? '—') : '—';
  const studyAreaName = (id: string | undefined) => id ? (studyAreaList.find(s => s.id === id)?.population ?? '—') : '—';

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Animals</h1>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Animal' : 'Add Animal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
                  <Input type="number" step="0.1" placeholder="5.2"
                    value={form.estAgeYears ?? ''}
                    onChange={(e) => setForm({ ...form, estAgeYears: e.target.value ? parseFloat(e.target.value) : undefined })} />
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
                      {speciesList.map(s => <SelectItem key={s.id} value={s.id}>{s.commonName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Study Area / Population</Label>
                  <Select value={form.studyArea_id} onValueChange={(v) => setForm({ ...form, studyArea_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select study area" /></SelectTrigger>
                    <SelectContent>
                      {studyAreaList.map(s => <SelectItem key={s.id} value={s.id}>{s.population}</SelectItem>)}
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
                <Button type="submit">{editingId ? 'Save Changes' : 'Add Animal'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {loading ? (
          <Card><Table><TableHeader><TableRow>{['ID','Sex','Age','Status','Species','Population',''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{Array.from({length:4}).map((_,i) => <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}</TableBody></Table></Card>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No animals yet.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal ID</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Age Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Population</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.animalId}</TableCell>
                    <TableCell>{item.sex}</TableCell>
                    <TableCell>{item.ageClass}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[item.currentStatus] ?? 'outline'}>
                        {item.currentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{speciesName(item.species_id)}</TableCell>
                    <TableCell>{studyAreaName(item.studyArea_id)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => void deleteAnimal(item.id).then(fetchItems)}>Delete</Button>
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
