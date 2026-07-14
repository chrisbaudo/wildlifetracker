import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createPersonnel,
  deletePersonnel,
  getPersonnel,
  updatePersonnel,
  type PersonnelItem,
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

  const fetchItems = useCallback(async () => {
    const data = await getPersonnel();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updatePersonnel(editingId, form);
      setEditingId(null);
    } else {
      await createPersonnel(form);
    }
    setForm(emptyForm);
    await fetchItems();
  };

  const handleEdit = (item: PersonnelItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, role: item.role });
  };

  const handleDelete = async (id: string) => {
    await deletePersonnel(id);
    await fetchItems();
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Personnel</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Personnel' : 'Add Personnel'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex gap-3">
                <Button type="submit">{editingId ? 'Save Changes' : 'Add Person'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {loading ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {['Name', 'Role', ''].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
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
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No personnel yet.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[item.role] ?? 'outline'}>
                        {item.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void handleDelete(item.id)}>Delete</Button>
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
