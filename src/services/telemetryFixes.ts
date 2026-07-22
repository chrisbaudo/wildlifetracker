import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface TelemetryFixItem {
  id: string;
  fixId: number;
  fixDatetimeUtc: Date;
  latitude: number;
  longitude: number;
  altitudeM?: number;
  fixType: string;
  numSatellites?: number;
  dop?: number;
  temperatureC?: number;
  activityIndex?: number;
  mortalityFlag: boolean;
  collarDeployment_id: string;
}

const FIELDS = [
  'id', 'fixId', 'fixDatetimeUtc', 'latitude', 'longitude', 'altitudeM',
  'fixType', 'numSatellites', 'dop', 'temperatureC', 'activityIndex',
  'mortalityFlag', 'collarDeployment_id',
] as never[];

const PAGE_SIZE = 5000;

/** Fetch all fixes for a single collar deployment. */
export async function getTelemetryFixesByDeployment(deploymentId: string): Promise<TelemetryFixItem[]> {
  if (isLocalBackend()) return [];
  const client = getRayfinClient();
  const all: TelemetryFixItem[] = [];

  let page = await client.data.TelemetryFixes
    .select(FIELDS)
    .where({ collarDeployment_id: { eq: deploymentId } } as never)
    .orderBy({ fixDatetimeUtc: 'asc' } as never)
    .first(PAGE_SIZE)
    .executePaginated();

  all.push(...(page.items as unknown as TelemetryFixItem[]));

  while (page.hasNextPage && page.endCursor) {
    page = await client.data.TelemetryFixes
      .select(FIELDS)
      .where({ collarDeployment_id: { eq: deploymentId } } as never)
      .orderBy({ fixDatetimeUtc: 'asc' } as never)
      .first(PAGE_SIZE)
      .after(page.endCursor)
      .executePaginated();
    all.push(...(page.items as unknown as TelemetryFixItem[]));
  }

  return all;
}

/** Fetch only the most recent fix for a single collar deployment. */
export async function getLastFixByDeployment(deploymentId: string): Promise<TelemetryFixItem | null> {
  if (isLocalBackend()) return null;
  const client = getRayfinClient();
  const page = await client.data.TelemetryFixes
    .select(FIELDS)
    .where({ collarDeployment_id: { eq: deploymentId } } as never)
    .orderBy({ fixDatetimeUtc: 'desc' } as never)
    .first(1)
    .executePaginated();
  return (page.items[0] as unknown as TelemetryFixItem) ?? null;
}
