import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface PersonnelItem {
  id: string;
  name: string;
  role: string;
  user_id?: string;
}

let inMemoryPersonnel: PersonnelItem[] = [];

export async function getPersonnel(): Promise<PersonnelItem[]> {
  if (isLocalBackend()) {
    return [...inMemoryPersonnel].sort((a, b) => a.name.localeCompare(b.name));
  }

  const client = getRayfinClient();
  const results = await client.data.Personnel.select(['id', 'name', 'role', 'user_id'])
    .orderBy({ name: 'asc' })
    .execute();
  return results as PersonnelItem[];
}

export async function createPersonnel(
  data: Omit<PersonnelItem, 'id'>
): Promise<PersonnelItem> {
  if (isLocalBackend()) {
    const item: PersonnelItem = { id: crypto.randomUUID(), ...data };
    inMemoryPersonnel.push(item);
    return item;
  }

  const client = getRayfinClient();
  const item = await client.data.Personnel.create(data);
  return item as PersonnelItem;
}

export async function updatePersonnel(
  id: string,
  updates: Partial<Omit<PersonnelItem, 'id'>>
): Promise<PersonnelItem> {
  if (isLocalBackend()) {
    const item = inMemoryPersonnel.find((p) => p.id === id);
    if (!item) throw new Error('Personnel not found');
    Object.assign(item, updates);
    return { ...item };
  }

  const client = getRayfinClient();
  await client.data.Personnel.update({ id }, updates);
  const item = await client.data.Personnel.findById(id);
  return item as PersonnelItem;
}

export async function deletePersonnel(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemoryPersonnel = inMemoryPersonnel.filter((p) => p.id !== id);
    return;
  }

  const client = getRayfinClient();
  await client.data.Personnel.delete({ id });
}
