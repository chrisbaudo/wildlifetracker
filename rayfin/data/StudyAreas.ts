import {
  decimal,
  entity,
  one,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { Species } from './Species.js';

@entity()
@role('authenticated', '*')
export class StudyAreas {
  @uuid() id!: string;
  @text({ max: 300 }) population!: string;
  @text({ max: 20 }) gmu!: string;
  @text({ max: 300 }) studyArea!: string;
  @decimal() centerLat!: number;
  @decimal() centerLon!: number;
  @text({ max: 1 }) migratory!: string;
  @one(() => Species) primarySpecies!: Species;
  @text({ optional: true }) user_id?: string;
}
