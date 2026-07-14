import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface CollarModelItem {
  id: string;
  vendor: string;
  model: string;
  vhfBeaconMhz: number;
  defaultFixIntervalHours: number;
  batteryLifeYears: number;
  user_id?: string;
}

let inMemoryCollarModels: CollarModelItem[] = [];

export async function getCollarModels(): Promise<CollarModelItem[]> {
  if (isLocalBackend()) {
    return [...inMemoryCollarModels].sort((a, b) =>
      a.vendor.localeCompare(b.vendor)
    );
  }

  const client = getRayfinClient();
  const results = await client.data.CollarModel.select([
    'id',
    'vendor',
    'model',
    'vhfBeaconMhz',
    'defaultFixIntervalHours',
    'batteryLifeYears',
    'user_id',
  ])
    .orderBy({ vendor: 'asc' })
    .execute();
  return results as CollarModelItem[];
}

export async function createCollarModel(
  data: Omit<CollarModelItem, 'id'>
): Promise<CollarModelItem> {
  if (isLocalBackend()) {
    const item: CollarModelItem = { id: crypto.randomUUID(), ...data };
    inMemoryCollarModels.push(item);
    return item;
  }

  const client = getRayfinClient();
  const item = await client.data.CollarModel.create(data);
  return item as CollarModelItem;
}

export async function updateCollarModel(
  id: string,
  updates: Partial<Omit<CollarModelItem, 'id'>>
): Promise<CollarModelItem> {
  if (isLocalBackend()) {
    const item = inMemoryCollarModels.find((m) => m.id === id);
    if (!item) throw new Error('CollarModel not found');
    Object.assign(item, updates);
    return { ...item };
  }

  const client = getRayfinClient();
  await client.data.CollarModel.update({ id }, updates);
  const item = await client.data.CollarModel.findById(id);
  return item as CollarModelItem;
}

export async function deleteCollarModel(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemoryCollarModels = inMemoryCollarModels.filter((m) => m.id !== id);
    return;
  }

  const client = getRayfinClient();
  await client.data.CollarModel.delete({ id });
}
