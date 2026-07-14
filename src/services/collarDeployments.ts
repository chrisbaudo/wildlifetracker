import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface CollarDeploymentItem {
  id: string;
  collarId: string;
  fixIntervalHours: number;
  deployDatetime: Date;
  endDatetime?: Date;
  endReason?: string;
  animal_id: string;
  collarModel_id: string;
  user_id?: string;
}

let inMemory: CollarDeploymentItem[] = [];

export async function getCollarDeployments(): Promise<CollarDeploymentItem[]> {
  if (isLocalBackend()) return [...inMemory].sort((a, b) => a.collarId.localeCompare(b.collarId));
  const client = getRayfinClient();
  const results = await client.data.CollarDeployments.select([
    'id', 'collarId', 'fixIntervalHours', 'deployDatetime', 'endDatetime',
    'endReason', 'animal_id', 'collarModel_id',
  ] as never[]).orderBy({ deployDatetime: 'desc' } as never).execute();
  return results as unknown as CollarDeploymentItem[];
}

export async function createCollarDeployment(data: Omit<CollarDeploymentItem, 'id'>): Promise<CollarDeploymentItem> {
  if (isLocalBackend()) {
    const item: CollarDeploymentItem = { id: crypto.randomUUID(), ...data };
    inMemory.push(item);
    return item;
  }
  const client = getRayfinClient();
  return (await client.data.CollarDeployments.create(data as never)) as unknown as CollarDeploymentItem;
}

export async function updateCollarDeployment(
  id: string, updates: Partial<Omit<CollarDeploymentItem, 'id'>>
): Promise<CollarDeploymentItem> {
  if (isLocalBackend()) {
    const item = inMemory.find(d => d.id === id);
    if (!item) throw new Error('Collar deployment not found');
    Object.assign(item, updates);
    return { ...item };
  }
  const client = getRayfinClient();
  await client.data.CollarDeployments.update({ id }, updates as never);
  return (await client.data.CollarDeployments.findById(id)) as unknown as CollarDeploymentItem;
}

export async function deleteCollarDeployment(id: string): Promise<void> {
  if (isLocalBackend()) { inMemory = inMemory.filter(d => d.id !== id); return; }
  const client = getRayfinClient();
  await client.data.CollarDeployments.delete({ id });
}
