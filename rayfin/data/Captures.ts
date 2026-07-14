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

import { Animals } from './Animals.js';
import { CollarDeployments } from './CollarDeployments.js';
import { Personnel } from './Personnel.js';

@entity()
@role('authenticated', '*')
export class Captures {
  @uuid() id!: string;
  @text({ max: 50 }) captureId!: string;
  @date() captureDatetime!: Date;
  @decimal() captureLat!: number;
  @decimal() captureLon!: number;
  @decimal({ optional: true }) bodyWeightKg?: number;
  @decimal({ optional: true }) chestGirthCm?: number;
  @decimal({ optional: true }) bodyConditionScore?: number;
  @text({ max: 200 }) captureMethod!: string;
  @text({ max: 200, optional: true }) immobilizationDrug?: string;
  @decimal({ optional: true }) drugDoseMl?: number;
  @int({ optional: true }) inductionMin?: number;
  @int({ optional: true }) handlingTimeMin?: number;
  @boolean() bloodSample!: boolean;
  @boolean() fecalSample!: boolean;
  @boolean() hairSample!: boolean;
  @boolean() toothExtracted!: boolean;
  @text({ optional: true }) notes?: string;
  @one(() => Animals) animal!: Animals;
  @one(() => Personnel) biologist!: Personnel;
  @one(() => Personnel) pilot!: Personnel;
  @one(() => CollarDeployments, { optional: true }) collarDeployment?: CollarDeployments;
  @text({ optional: true }) user_id?: string;
}
