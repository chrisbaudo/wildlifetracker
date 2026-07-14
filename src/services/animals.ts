import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface AnimalItem {
  id: string;
  animalId: string;
  sex: string;
  ageClass: string;
  estAgeYears?: number;
  earTagId: string;
  currentStatus: string;
  mortalityCause?: string;
  createdAt: Date;
  species_id: string;
  studyArea_id: string;
  user_id?: string;
}

let inMemoryAnimals: AnimalItem[] = [];

export async function getAnimals(): Promise<AnimalItem[]> {
  if (isLocalBackend()) {
    return [...inMemoryAnimals].sort((a, b) => a.animalId.localeCompare(b.animalId));
  }
  const client = getRayfinClient();
  const results = await client.data.Animals.select([
    'id', 'animalId', 'sex', 'ageClass', 'estAgeYears', 'earTagId',
    'currentStatus', 'mortalityCause', 'createdAt', 'species_id', 'studyArea_id',
  ] as never[]).orderBy({ animalId: 'asc' } as never).execute();
  return results as unknown as AnimalItem[];
}

export async function createAnimal(data: Omit<AnimalItem, 'id'>): Promise<AnimalItem> {
  if (isLocalBackend()) {
    const item: AnimalItem = { id: crypto.randomUUID(), ...data };
    inMemoryAnimals.push(item);
    return item;
  }
  const client = getRayfinClient();
  return (await client.data.Animals.create(data as never)) as unknown as AnimalItem;
}

export async function updateAnimal(
  id: string,
  updates: Partial<Omit<AnimalItem, 'id'>>
): Promise<AnimalItem> {
  if (isLocalBackend()) {
    const item = inMemoryAnimals.find((a) => a.id === id);
    if (!item) throw new Error('Animal not found');
    Object.assign(item, updates);
    return { ...item };
  }
  const client = getRayfinClient();
  await client.data.Animals.update({ id }, updates as never);
  return (await client.data.Animals.findById(id)) as unknown as AnimalItem;
}

export async function deleteAnimal(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemoryAnimals = inMemoryAnimals.filter((a) => a.id !== id);
    return;
  }
  const client = getRayfinClient();
  await client.data.Animals.delete({ id });
}
