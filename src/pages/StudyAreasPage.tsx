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
import { getSpecies, type SpeciesItem } from '@/services/species';
import {
  createStudyArea, deleteStudyArea, getStudyAreas, updateStudyArea, type StudyAreaItem,
} from '@/services/studyAreas';

const emptyForm = {
  population: '', gmu: '', studyArea: '',
  centerLat: 0, centerLon: 0, migratory: 'N', primarySpecies_id: '',
};

export function StudyAreasPage() {
  const [items, setItems] = useState<StudyAreaItem[]>([]);
  const [speciesList, setSpeciesList] = useState<SpeciesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setError(null);
    try {
      const [areas, sp] = await Promise.all([getStudyAreas(), getSpecies()]);
      setItems(areas);
      setSpeciesList(sp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await updateStudyArea(editingId, form); setEditingId(null); }
    else { await createStudyArea(form); }
    setForm(emptyForm);
    await fetchItems();
  };

  const handleEdit = (item: StudyAreaItem) => {
    setEditingId(item.id);
    setForm({
      population: item.population, gmu: item.gmu, studyArea: item.studyArea,
      centerLat: item.centerLat, centerLon: item.centerLon, migratory: item.migratory,
      primarySpecies_id: item.primarySpecies_id,
    });
  };

  const speciesName = (id: string | undefined) => id ? (speciesList.find(s => s.id === id)?.commonName ?? '—') : '—';

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Study Areas</h1>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Study Area' : 'Add Study Area'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Population</Label>
                  <Input required placeholder="e.g. Western Arctic Herd" value={form.population}
                    onChange={(e) => setForm({ ...form, population: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Study Area</Label>
                  <Input required placeholder="e.g. Northwest Arctic" value={form.studyArea}
                    onChange={(e) => setForm({ ...form, studyArea: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>GMU</Label>
                  <Input required placeholder="e.g. 23" value={form.gmu}
                    onChange={(e) => setForm({ ...form, gmu: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Primary Species</Label>
                  <Select value={form.primarySpecies_id} onValueChange={(v) => setForm({ ...form, primarySpecies_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                    <SelectContent>
                      {speciesList.map(s => <SelectItem key={s.id} value={s.id}>{s.commonName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Center Lat</Label>
                  <Input required type="number" step="any" placeholder="68.1" value={form.centerLat || ''}
                    onChange={(e) => setForm({ ...form, centerLat: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Center Lon</Label>
                  <Input required type="number" step="any" placeholder="-159.4" value={form.centerLon || ''}
                    onChange={(e) => setForm({ ...form, centerLon: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Migratory</Label>
                  <Select value={form.migratory} onValueChange={(v) => setForm({ ...form, migratory: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Yes</SelectItem>
                      <SelectItem value="N">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">{editingId ? 'Save Changes' : 'Add Study Area'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {loading ? (
          <Card><Table><TableHeader><TableRow>{['Population','Study Area','GMU','Species','Migratory',''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:6}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}</TableBody></Table></Card>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No study areas yet.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Population</TableHead>
                  <TableHead>Study Area</TableHead>
                  <TableHead>GMU</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Migratory</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.population}</TableCell>
                    <TableCell>{item.studyArea}</TableCell>
                    <TableCell>{item.gmu}</TableCell>
                    <TableCell><Badge variant="secondary">{speciesName(item.primarySpecies_id)}</Badge></TableCell>
                    <TableCell>{item.migratory === 'Y' ? '✓' : '—'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => void deleteStudyArea(item.id).then(fetchItems)}>Delete</Button>
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
