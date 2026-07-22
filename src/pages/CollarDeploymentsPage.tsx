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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
import { getAnimals, type AnimalItem } from '@/services/animals';
import {
  createCollarDeployment, deleteCollarDeployment,
  getCollarDeployments, updateCollarDeployment, type CollarDeploymentItem,
} from '@/services/collarDeployments';
import { getCollarModels, type CollarModelItem } from '@/services/collarModels';

const toDateInput = (d: Date | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

const emptyForm = {
  collarId: "",
  fixIntervalHours: 4,
  deployDatetime: toDateInput(new Date()),
  endDatetime: "",
  endReason: "",
  animal_id: "",
  collarModel_id: "",
};

export function CollarDeploymentsPage() {
  const [items, setItems] = useState<CollarDeploymentItem[]>([]);
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [collarModels, setCollarModels] = useState<CollarModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { search, setSearch, filtered } = useSearch(items);
  const { sorted, sortKey, sortDir, toggleSort } = useSorting(filtered);
  const { page, setPage, pageItems, pageCount } = usePagination(sorted);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [deps, anims, cms] = await Promise.all([
        getCollarDeployments(), getAnimals(), getCollarModels(),
      ]);
      setItems(deps);
      setAnimals(anims);
      setCollarModels(cms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Omit<CollarDeploymentItem, 'id'> = {
        collarId: form.collarId,
        fixIntervalHours: Number(form.fixIntervalHours),
        deployDatetime: new Date(form.deployDatetime),
        endDatetime: form.endDatetime ? new Date(form.endDatetime) : undefined,
        endReason: form.endReason || undefined,
        animal_id: form.animal_id,
        collarModel_id: form.collarModel_id,
      };
      if (editingId) {
        await updateCollarDeployment(editingId, data);
        setEditingId(null);
      } else {
        await createCollarDeployment(data);
      }
      setForm(emptyForm);
      await fetchAll();
      setSheetOpen(false);
      toast.success('Deployment saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: CollarDeploymentItem) => {
    setEditingId(item.id);
    setForm({
      collarId: item.collarId,
      fixIntervalHours: item.fixIntervalHours,
      deployDatetime: toDateInput(item.deployDatetime),
      endDatetime: toDateInput(item.endDatetime),
      endReason: item.endReason ?? '',
      animal_id: item.animal_id,
      collarModel_id: item.collarModel_id,
    });
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCollarDeployment(id);
      await fetchAll();
      toast.success('Deployment deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const animalLabel = (id: string | undefined) =>
    id ? (animals.find(a => a.id === id)?.animalId ?? id.slice(0, 8)) : '—';
  const modelLabel = (id: string | undefined) => {
    if (!id) return '—';
    const m = collarModels.find(c => c.id === id);
    return m ? `${m.vendor} ${m.model}` : id.slice(0, 8);
  };

  const handleExport = () => {
    exportToCsv('collar-deployments.csv', filtered.map(d => ({
      'Collar ID': d.collarId,
      'Animal': animalLabel(d.animal_id),
      'Model': modelLabel(d.collarModel_id),
      'Fix Interval (hr)': d.fixIntervalHours,
      'Deploy Date': new Date(d.deployDatetime).toISOString().slice(0, 10),
      'End Date': d.endDatetime ? new Date(d.endDatetime).toISOString().slice(0, 10) : '',
      'End Reason': d.endReason ?? '',
    })));
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Collar Deployments</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={14} className="mr-1.5" /> Export CSV
            </Button>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); setSheetOpen(true); }}>Add Deployment</Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Deployment' : 'Add Deployment'}</SheetTitle>
            </SheetHeader>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Collar ID</Label>
                  <Input required placeholder="e.g. COL-001" value={form.collarId}
                    onChange={(e) => setForm({ ...form, collarId: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Fix Interval (hours)</Label>
                  <Input required type="number" min={1} value={form.fixIntervalHours}
                    onChange={(e) => setForm({ ...form, fixIntervalHours: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Animal</Label>
                  <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                    <SelectContent>
                      {animals.map(a => <SelectItem key={a.id} value={a.id}>{a.animalId}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Collar Model</Label>
                  <Select value={form.collarModel_id} onValueChange={(v) => setForm({ ...form, collarModel_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                    <SelectContent>
                      {collarModels.map(m => <SelectItem key={m.id} value={m.id}>{m.vendor} {m.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Deploy Date</Label>
                  <Input required type="date" value={form.deployDatetime}
                    onChange={(e) => setForm({ ...form, deployDatetime: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>End Date <span className="text-muted-foreground">(optional)</span></Label>
                  <Input type="date" value={form.endDatetime}
                    onChange={(e) => setForm({ ...form, endDatetime: e.target.value })} />
                </div>
                {form.endDatetime && (
                  <div className="space-y-1 col-span-2">
                    <Label>End Reason <span className="text-muted-foreground">(optional)</span></Label>
                    <Input placeholder="e.g. collar drop-off" value={form.endReason}
                      onChange={(e) => setForm({ ...form, endReason: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Add Deployment')}</Button>
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
              <TableHeader>
                <TableRow>
                  {['Collar ID', 'Animal', 'Model', 'Fix Interval (h)', 'Deploy Date', 'End Date', 'Status', ''].map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">{search ? 'No results match your search.' : 'No collar deployments found.'}</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Collar ID" sortKey="collarId" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <TableHead>Animal</TableHead>
                  <TableHead>Model</TableHead>
                  <SortableHead label="Fix Interval (h)" sortKey="fixIntervalHours" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                  <SortableHead label="Deploy Date" sortKey="deployDatetime" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="End Date" sortKey="endDatetime" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((item) => {
                  const active = !item.endDatetime;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.collarId}</TableCell>
                      <TableCell><Badge variant="secondary">{animalLabel(item.animal_id)}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{modelLabel(item.collarModel_id)}</TableCell>
                      <TableCell className="text-right">{item.fixIntervalHours}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {item.deployDatetime ? new Date(item.deployDatetime).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {item.endDatetime ? new Date(item.endDatetime).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        {active
                          ? <Badge variant="default">Active</Badge>
                          : <Badge variant="outline">{item.endReason ?? 'Ended'}</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                        <ConfirmDelete label="deployment" onConfirm={() => void handleDelete(item.id)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pager page={page} pageCount={pageCount} onPageChange={setPage} />
          </Card>
        )}
      </main>
    </div>
  );
}
