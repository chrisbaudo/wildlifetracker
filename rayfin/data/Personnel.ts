import {
  entity,
  role,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class Personnel {
  @uuid() id!: string;
  @text({ max: 200 }) name!: string;
  @text({ max: 100 }) role!: string;
  @text({ optional: true }) user_id?: string;
}
