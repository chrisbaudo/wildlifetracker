import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Download from 'lucide-react/dist/esm/icons/download';
import { exportToCsv } from '@/lib/exportCsv';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pager } from '@/components/ui/pager';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { SortableHead } from '@/components/ui/sortable-head';
import { useSearch } from '@/hooks/useSearch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  createSpecies, deleteSpecies, getSpecies, updateSpecies, type SpeciesItem,
} from '@/services/species';

const emptyForm = { commonName: '', scientificName: '' };

export function SpeciesPage() {
  const [items, setItems] = useState<SpeciesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { search, setSearch, filtered } = useSearch(items);
  const { sorted, sortKey, sortDir, toggleSort } = useSorting(filtered);
  const { page, setPage, pageItems, pageCount } = usePagination(sorted);

  const fetchItems = useCallback(async () => {
    const data = await getSpecies();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) { await updateSpecies(editingId, form); setEditingId(null); }
      else { await createSpecies(form); }
      setForm(emptyForm);
      await fetchItems();
      setSheetOpen(false);
      toast.success('Species saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: SpeciesItem) => {
    setEditingId(item.id);
    setForm({ commonName: item.commonName, scientificName: item.scientificName });
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpecies(id);
      await fetchItems();
      toast.success('Species deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleExport = () => {
    exportToCsv('species.csv', filtered.map(s => ({
      'Common Name': s.commonName,
      'Scientific Name': s.scientificName,
    })));
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Species</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={14} className="mr-1.5" /> Export CSV
            </Button>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); setSheetOpen(true); }}>Add Species</Button>
          </div>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Species' : 'Add Species'}</SheetTitle>
            </SheetHeader>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Common Name</Label>
                  <Input required placeholder="e.g. Caribou" value={form.commonName}
                    onChange={(e) => setForm({ ...form, commonName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Scientific Name</Label>
                  <Input required placeholder="e.g. Rangifer tarandus granti" value={form.scientificName}
                    onChange={(e) => setForm({ ...form, scientificName: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Add Species')}</Button>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <div className="mb-4">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>

        {loading ? (
          <Card>
            <Table>
              <TableHeader><TableRow>{['Common Name','Scientific Name',''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:3}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}</TableBody>
            </Table>
          </Card>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">{search ? 'No results match your search.' : 'No species yet.'}</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Common Name" sortKey="commonName" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Scientific Name" sortKey="scientificName" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
              {pageItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="secondary">{item.commonName}</Badge></TableCell>
                    <TableCell className="italic text-muted-foreground">{item.scientificName}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <ConfirmDelete label="species" onConfirm={() => void handleDelete(item.id)} />
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
