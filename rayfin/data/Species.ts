import {
  entity,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class Species {
  @uuid() id!: string;
  @text({ max: 200 }) commonName!: string;
  @text({ max: 300 }) scientificName!: string;
  @text({ optional: true }) user_id?: string;
}
