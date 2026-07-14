import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface StudyAreaItem {
  id: string;
  population: string;
  gmu: string;
  studyArea: string;
  centerLat: number;
  centerLon: number;
  migratory: string;
  primarySpecies_id: string;
  user_id?: string;
}

let inMemoryStudyAreas: StudyAreaItem[] = [];

export async function getStudyAreas(): Promise<StudyAreaItem[]> {
  if (isLocalBackend()) {
    return [...inMemoryStudyAreas].sort((a, b) => a.population.localeCompare(b.population));
  }
  const client = getRayfinClient();
  const results = await client.data.StudyAreas.select([
    'id', 'population', 'gmu', 'studyArea', 'centerLat', 'centerLon', 'migratory', 'primarySpecies_id',
  ] as never[]).orderBy({ population: 'asc' } as never).execute();
  return results as unknown as StudyAreaItem[];
}

export async function createStudyArea(data: Omit<StudyAreaItem, 'id'>): Promise<StudyAreaItem> {
  if (isLocalBackend()) {
    const item: StudyAreaItem = { id: crypto.randomUUID(), ...data };
    inMemoryStudyAreas.push(item);
    return item;
  }
  const client = getRayfinClient();
  return (await client.data.StudyAreas.create(data as never)) as unknown as StudyAreaItem;
}

export async function updateStudyArea(
  id: string,
  updates: Partial<Omit<StudyAreaItem, 'id'>>
): Promise<StudyAreaItem> {
  if (isLocalBackend()) {
    const item = inMemoryStudyAreas.find((s) => s.id === id);
    if (!item) throw new Error('Study area not found');
    Object.assign(item, updates);
    return { ...item };
  }
  const client = getRayfinClient();
  await client.data.StudyAreas.update({ id }, updates as never);
  return (await client.data.StudyAreas.findById(id)) as unknown as StudyAreaItem;
}

export async function deleteStudyArea(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemoryStudyAreas = inMemoryStudyAreas.filter((s) => s.id !== id);
    return;
  }
  const client = getRayfinClient();
  await client.data.StudyAreas.delete({ id });
}
