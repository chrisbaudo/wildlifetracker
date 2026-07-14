import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pager } from '@/components/ui/pager';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagination } from '@/hooks/usePagination';
import { useSearch } from '@/hooks/useSearch';
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
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { search, setSearch, filtered } = useSearch(items);
  const { page, setPage, pageItems, pageCount } = usePagination(filtered);

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
    setSaving(true);
    try {
      if (editingId) { await updateStudyArea(editingId, form); setEditingId(null); }
      else { await createStudyArea(form); }
      setForm(emptyForm);
      await fetchItems();
      setSheetOpen(false);
      toast.success('Study area saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: StudyAreaItem) => {
    setEditingId(item.id);
    setForm({
      population: item.population, gmu: item.gmu, studyArea: item.studyArea,
      centerLat: item.centerLat, centerLon: item.centerLon, migratory: item.migratory,
      primarySpecies_id: item.primarySpecies_id,
    });
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudyArea(id);
      await fetchItems();
      toast.success('Study area deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const speciesName = (id: string | undefined) => id ? (speciesList.find(s => s.id === id)?.commonName ?? '—') : '—';

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Study Areas</h1>
          <Button onClick={() => { setEditingId(null); setForm(emptyForm); setSheetOpen(true); }}>Add Study Area</Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Study Area' : 'Add Study Area'}</SheetTitle>
            </SheetHeader>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-4">
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
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Add Study Area')}</Button>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <div className="mb-4">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>

        {loading ? (
          <Card><Table><TableHeader><TableRow>{['Population','Study Area','GMU','Species','Migratory',''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:6}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}</TableBody></Table></Card>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">{search ? 'No results match your search.' : 'No study areas yet.'}</p>
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
                {pageItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.population}</TableCell>
                    <TableCell>{item.studyArea}</TableCell>
                    <TableCell>{item.gmu}</TableCell>
                    <TableCell><Badge variant="secondary">{speciesName(item.primarySpecies_id)}</Badge></TableCell>
                    <TableCell>{item.migratory === 'Y' ? '✓' : '—'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <ConfirmDelete label="study area" onConfirm={() => void handleDelete(item.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pager page={page} pageCount={pageCount} onPageChange={setPage} />
          </Card>
        )}
      </main>
    </div>
  );
}
