import {
  date,
  entity,
  int,
  one,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { Animals } from './Animals.js';
import { CollarModel } from './CollarModel.js';

@entity()
@role('authenticated', '*')
export class CollarDeployments {
  @uuid() id!: string;
  @text({ max: 50 }) collarId!: string;
  @int() fixIntervalHours!: number;
  @date() deployDatetime!: Date;
  @date({ optional: true }) endDatetime?: Date;
  @text({ max: 100, optional: true }) endReason?: string;
  @one(() => Animals) animal!: Animals;
  @one(() => CollarModel) collarModel!: CollarModel;
  @text({ optional: true }) user_id?: string;
}
