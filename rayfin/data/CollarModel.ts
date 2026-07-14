import {
  decimal,
  entity,
  int,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class CollarModel {
  @uuid() id!: string;
  @text({ max: 100 }) vendor!: string;
  @text({ max: 200 }) model!: string;
  @decimal() vhfBeaconMhz!: number;
  @int() defaultFixIntervalHours!: number;
  @int() batteryLifeYears!: number;
  @text({ optional: true }) user_id?: string;
}
