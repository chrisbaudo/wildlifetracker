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

/** Read-only — no create/update/delete */
export async function getTelemetryFixes(): Promise<TelemetryFixItem[]> {
  if (isLocalBackend()) return [];

  const client = getRayfinClient();
  const results = await client.data.TelemetryFixes.select([
    'id', 'fixId', 'fixDatetimeUtc', 'latitude', 'longitude', 'altitudeM',
    'fixType', 'numSatellites', 'dop', 'temperatureC', 'activityIndex',
    'mortalityFlag', 'collarDeployment_id',
  ] as never[]).orderBy({ fixDatetimeUtc: 'asc' } as never).execute();
  return results as unknown as TelemetryFixItem[];
}
