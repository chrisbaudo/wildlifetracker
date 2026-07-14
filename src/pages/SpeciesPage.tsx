import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  createSpecies, deleteSpecies, getSpecies, updateSpecies, type SpeciesItem,
} from '@/services/species';

const emptyForm = { commonName: '', scientificName: '' };

export function SpeciesPage() {
  const [items, setItems] = useState<SpeciesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const data = await getSpecies();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await updateSpecies(editingId, form); setEditingId(null); }
    else { await createSpecies(form); }
    setForm(emptyForm);
    await fetchItems();
  };

  const handleEdit = (item: SpeciesItem) => {
    setEditingId(item.id);
    setForm({ commonName: item.commonName, scientificName: item.scientificName });
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Species</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Species' : 'Add Species'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
                <Button type="submit">{editingId ? 'Save Changes' : 'Add Species'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {loading ? (
          <Card>
            <Table>
              <TableHeader><TableRow>{['Common Name','Scientific Name',''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:3}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}</TableBody>
            </Table>
          </Card>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No species yet.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TooltipProvider>
                    <TableHead>
                      <Tooltip>
                        <TooltipTrigger className="underline decoration-dotted cursor-help">Scientific Name</TooltipTrigger>
                        <TooltipContent>Latin binomial name</TooltipContent>
                      </Tooltip>
                    </TableHead>
                  </TooltipProvider>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="secondary">{item.commonName}</Badge></TableCell>
                    <TableCell className="italic text-muted-foreground">{item.scientificName}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => void deleteSpecies(item.id).then(fetchItems)}>Delete</Button>
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
