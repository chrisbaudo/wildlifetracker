import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getAnimals, type AnimalItem } from "@/services/animals";
import { getCollarModels, type CollarModelItem } from "@/services/collarModels";
import {
  getCollarDeployments, type CollarDeploymentItem,
} from "@/services/collarDeployments";

export function CollarDeploymentsPage() {
  const [items, setItems] = useState<CollarDeploymentItem[]>([]);
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [collarModels, setCollarModels] = useState<CollarModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const animalLabel = (id: string | undefined) =>
    id ? (animals.find(a => a.id === id)?.animalId ?? id.slice(0, 8)) : "—";
  const modelLabel = (id: string | undefined) => {
    if (!id) return "—";
    const m = collarModels.find(c => c.id === id);
    return m ? `${m.vendor} ${m.model}` : id.slice(0, 8);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Collar Deployments</h1>
          <Badge variant="outline" className="text-muted-foreground">Read-only</Badge>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Collar ID","Animal","Model","Fix Interval (h)","Deploy Date","End Date","Status"].map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">No collar deployments found.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collar ID</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Fix Interval (h)</TableHead>
                  <TableHead>Deploy Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const active = !item.endDatetime;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.collarId}</TableCell>
                      <TableCell><Badge variant="secondary">{animalLabel(item.animal_id)}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{modelLabel(item.collarModel_id)}</TableCell>
                      <TableCell className="text-right">{item.fixIntervalHours}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {item.deployDatetime ? new Date(item.deployDatetime).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {item.endDatetime ? new Date(item.endDatetime).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {active
                          ? <Badge variant="default">Active</Badge>
                          : <Badge variant="outline">{item.endReason ?? "Ended"}</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
