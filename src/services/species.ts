import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface SpeciesItem {
  id: string;
  commonName: string;
  scientificName: string;
  user_id?: string;
}

let inMemorySpecies: SpeciesItem[] = [];

export async function getSpecies(): Promise<SpeciesItem[]> {
  if (isLocalBackend()) {
    return [...inMemorySpecies].sort((a, b) => a.commonName.localeCompare(b.commonName));
  }
  const client = getRayfinClient();
  const results = await client.data.Species.select(['id', 'commonName', 'scientificName'])
    .orderBy({ commonName: 'asc' })
    .execute();
  return results as SpeciesItem[];
}

export async function createSpecies(data: Omit<SpeciesItem, 'id'>): Promise<SpeciesItem> {
  if (isLocalBackend()) {
    const item: SpeciesItem = { id: crypto.randomUUID(), ...data };
    inMemorySpecies.push(item);
    return item;
  }
  const client = getRayfinClient();
  return (await client.data.Species.create(data)) as SpeciesItem;
}

export async function updateSpecies(
  id: string,
  updates: Partial<Omit<SpeciesItem, 'id'>>
): Promise<SpeciesItem> {
  if (isLocalBackend()) {
    const item = inMemorySpecies.find((s) => s.id === id);
    if (!item) throw new Error('Species not found');
    Object.assign(item, updates);
    return { ...item };
  }
  const client = getRayfinClient();
  await client.data.Species.update({ id }, updates);
  return (await client.data.Species.findById(id)) as SpeciesItem;
}

export async function deleteSpecies(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemorySpecies = inMemorySpecies.filter((s) => s.id !== id);
    return;
  }
  const client = getRayfinClient();
  await client.data.Species.delete({ id });
}
