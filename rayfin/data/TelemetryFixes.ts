import {
  boolean,
  date,
  decimal,
  entity,
  int,
  one,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { CollarDeployments } from './CollarDeployments.js';

@entity()
@role('authenticated', '*')
export class TelemetryFixes {
  @uuid() id!: string;
  @int() fixId!: number;
  @date() fixDatetimeUtc!: Date;
  @decimal() latitude!: number;
  @decimal() longitude!: number;
  @decimal({ optional: true }) altitudeM?: number;
  @text({ max: 10 }) fixType!: string;
  @int({ optional: true }) numSatellites?: number;
  @decimal({ optional: true }) dop?: number;
  @decimal({ optional: true }) temperatureC?: number;
  @int({ optional: true }) activityIndex?: number;
  @boolean() mortalityFlag!: boolean;
  @one(() => CollarDeployments) collarDeployment!: CollarDeployments;
  @text({ optional: true }) user_id?: string;
}
