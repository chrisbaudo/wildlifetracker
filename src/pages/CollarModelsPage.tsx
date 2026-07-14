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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  createCollarModel,
  deleteCollarModel,
  getCollarModels,
  updateCollarModel,
  type CollarModelItem,
} from '@/services/collarModels';

const emptyForm = {
  vendor: '',
  model: '',
  vhfBeaconMhz: 0,
  defaultFixIntervalHours: 1,
  batteryLifeYears: 1,
};

export function CollarModelsPage() {
  const [items, setItems] = useState<CollarModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const data = await getCollarModels();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCollarModel(editingId, form);
      setEditingId(null);
    } else {
      await createCollarModel(form);
    }
    setForm(emptyForm);
    await fetchItems();
  };

  const handleEdit = (item: CollarModelItem) => {
    setEditingId(item.id);
    setForm({
      vendor: item.vendor,
      model: item.model,
      vhfBeaconMhz: item.vhfBeaconMhz,
      defaultFixIntervalHours: item.defaultFixIntervalHours,
      batteryLifeYears: item.batteryLifeYears,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteCollarModel(id);
    await fetchItems();
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Collar Models</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Collar Model' : 'Add Collar Model'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Vendor</Label>
                  <Input required placeholder="e.g. Lotek" value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Model</Label>
                  <Input required placeholder="e.g. LiteTrack Iridium 150" value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>VHF Beacon (MHz)</Label>
                  <Input required type="number" step="any" placeholder="148.0"
                    value={form.vhfBeaconMhz || ''}
                    onChange={(e) => setForm({ ...form, vhfBeaconMhz: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Fix Interval (hrs)</Label>
                  <Input required type="number" min={1} placeholder="5"
                    value={form.defaultFixIntervalHours || ''}
                    onChange={(e) => setForm({ ...form, defaultFixIntervalHours: parseInt(e.target.value, 10) })} />
                </div>
                <div className="space-y-1">
                  <Label>Battery Life (years)</Label>
                  <Input required type="number" min={1} placeholder="3"
                    value={form.batteryLifeYears || ''}
                    onChange={(e) => setForm({ ...form, batteryLifeYears: parseInt(e.target.value, 10) })} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">{editingId ? 'Save Changes' : 'Add Model'}</Button>
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
                  {['Vendor','Model','VHF (MHz)','Fix Interval (h)','Battery (yrs)',''].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No collar models yet.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Model</TableHead>
                  <TooltipProvider>
                    <TableHead className="text-right">
                      <Tooltip>
                        <TooltipTrigger className="underline decoration-dotted cursor-help">VHF (MHz)</TooltipTrigger>
                        <TooltipContent>VHF beacon frequency used for radio tracking</TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-right">
                      <Tooltip>
                        <TooltipTrigger className="underline decoration-dotted cursor-help">Fix Interval (h)</TooltipTrigger>
                        <TooltipContent>Hours between GPS location fixes</TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-right">
                      <Tooltip>
                        <TooltipTrigger className="underline decoration-dotted cursor-help">Battery (yrs)</TooltipTrigger>
                        <TooltipContent>Expected battery life in years</TooltipContent>
                      </Tooltip>
                    </TableHead>
                  </TooltipProvider>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">{item.vendor}</Badge>
                    </TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell className="text-right">{item.vhfBeaconMhz}</TableCell>
                    <TableCell className="text-right">{item.defaultFixIntervalHours}</TableCell>
                    <TableCell className="text-right">{item.batteryLifeYears}</TableCell>
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

