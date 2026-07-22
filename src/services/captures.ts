import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface CaptureItem {
  id: string;
  captureId: string;
  captureDatetime: Date;
  captureLat: number;
  captureLon: number;
  bodyWeightKg?: number;
  chestGirthCm?: number;
  bodyConditionScore?: number;
  captureMethod: string;
  immobilizationDrug?: string;
  drugDoseMl?: number;
  inductionMin?: number;
  handlingTimeMin?: number;
  bloodSample: boolean;
  fecalSample: boolean;
  hairSample: boolean;
  toothExtracted: boolean;
  notes?: string;
  animal_id: string;
  biologist_id: string;
  pilot_id: string;
  collarDeployment_id?: string;
  user_id?: string;
}

let inMemory: CaptureItem[] = [];

export async function getCaptures(): Promise<CaptureItem[]> {
  if (isLocalBackend()) return [...inMemory].sort((a, b) => a.captureId.localeCompare(b.captureId));
  const client = getRayfinClient();
  const results = await client.data.Captures.select([
    'id', 'captureId', 'captureDatetime', 'captureLat', 'captureLon',
    'bodyWeightKg', 'chestGirthCm', 'bodyConditionScore', 'captureMethod',
    'immobilizationDrug', 'drugDoseMl', 'inductionMin', 'handlingTimeMin',
    'bloodSample', 'fecalSample', 'hairSample', 'toothExtracted', 'notes',
    'animal_id', 'biologist_id', 'pilot_id', 'collarDeployment_id',
  ] as never[]).orderBy({ captureDatetime: 'desc' } as never).execute();
  return results as unknown as CaptureItem[];
}

export async function createCapture(data: Omit<CaptureItem, 'id'>): Promise<CaptureItem> {
  if (isLocalBackend()) {
    const item: CaptureItem = { id: crypto.randomUUID(), ...data };
    inMemory.push(item);
    return item;
  }
  const client = getRayfinClient();
  return (await client.data.Captures.create(data as never)) as unknown as CaptureItem;
}

export async function updateCapture(
  id: string, updates: Partial<Omit<CaptureItem, 'id'>>
): Promise<CaptureItem> {
  if (isLocalBackend()) {
    const item = inMemory.find(c => c.id === id);
    if (!item) throw new Error('Capture not found');
    Object.assign(item, updates);
    return { ...item };
  }
  const client = getRayfinClient();
  await client.data.Captures.update({ id }, updates as never);
  return (await client.data.Captures.findById(id)) as unknown as CaptureItem;
}

export async function deleteCapture(id: string): Promise<void> {
  if (isLocalBackend()) { inMemory = inMemory.filter(c => c.id !== id); return; }
  const client = getRayfinClient();
  await client.data.Captures.delete({ id });
}

export async function getCapturesByAnimal(animalId: string): Promise<CaptureItem[]> {
  if (isLocalBackend()) return inMemory.filter(c => c.animal_id === animalId);
  const client = getRayfinClient();
  const results = await client.data.Captures.select([
    'id', 'captureId', 'captureDatetime', 'captureLat', 'captureLon',
    'bodyWeightKg', 'chestGirthCm', 'bodyConditionScore', 'captureMethod',
    'immobilizationDrug', 'drugDoseMl', 'inductionMin', 'handlingTimeMin',
    'bloodSample', 'fecalSample', 'hairSample', 'toothExtracted', 'notes',
    'animal_id', 'biologist_id', 'pilot_id', 'collarDeployment_id',
  ] as never[])
    .where({ animal_id: { eq: animalId } } as never)
    .orderBy({ captureDatetime: 'desc' } as never)
    .execute();
  return results as unknown as CaptureItem[];
}
