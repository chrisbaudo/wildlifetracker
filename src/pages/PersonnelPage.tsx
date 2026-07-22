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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { SortableHead } from '@/components/ui/sortable-head';
import { useSearch } from '@/hooks/useSearch';
import {
  createPersonnel, deletePersonnel, getPersonnel, updatePersonnel, type PersonnelItem,
} from '@/services/personnel';

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  Biologist: 'default',
  Pilot: 'secondary',
};

const emptyForm = { name: '', role: '' };

export function PersonnelPage() {
  const [items, setItems] = useState<PersonnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { search, setSearch, filtered } = useSearch(items);
  const { sorted, sortKey, sortDir, toggleSort } = useSorting(filtered);
  const { page, setPage, pageItems, pageCount } = usePagination(sorted);

  const fetchItems = useCallback(async () => {
    const data = await getPersonnel();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updatePersonnel(editingId, form);
        setEditingId(null);
      } else {
        await createPersonnel(form);
      }
      setForm(emptyForm);
      setSheetOpen(false);
      toast.success(editingId ? 'Person updated.' : 'Person added.');
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: PersonnelItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, role: item.role });
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePersonnel(id);
      await fetchItems();
      toast.success('Person deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleExport = () => {
    exportToCsv('personnel.csv', filtered.map(p => ({
      'Name': p.name,
      'Role': p.role,
    })));
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Personnel</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={14} className="mr-1.5" /> Export CSV
            </Button>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); setSheetOpen(true); }}>Add Person</Button>
          </div>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Person' : 'Add Person'}</SheetTitle>
            </SheetHeader>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input required placeholder="e.g. S. Wren" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Input required placeholder="e.g. Biologist" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Add Person')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <div className="mb-4">
          <Input placeholder="Search personnel…" value={search}
            onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>

        {loading ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>{['Name', 'Role', ''].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {search ? 'No results match your search.' : 'No personnel yet.'}
          </p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Name" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Role" sortKey="role" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[item.role] ?? 'outline'}>{item.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <ConfirmDelete label="person" onConfirm={() => void handleDelete(item.id)} />
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
