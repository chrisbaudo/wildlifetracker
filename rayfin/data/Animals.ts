import {
  date,
  decimal,
  entity,
  one,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { Species } from './Species.js';
import { StudyAreas } from './StudyAreas.js';

@entity()
@role('authenticated', '*')
export class Animals {
  @uuid() id!: string;
  @text({ max: 50 }) animalId!: string;
  @text({ max: 10 }) sex!: string;
  @text({ max: 50 }) ageClass!: string;
  @decimal({ optional: true }) estAgeYears?: number;
  @text({ max: 50 }) earTagId!: string;
  @text({ max: 50 }) currentStatus!: string;
  @text({ max: 200, optional: true }) mortalityCause?: string;
  @date() createdAt!: Date;
  @one(() => Species) species!: Species;
  @one(() => StudyAreas) studyArea!: StudyAreas;
  @text({ optional: true }) user_id?: string;
}
