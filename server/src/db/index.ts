import { drizzle as d1, DrizzleD1Database } from 'drizzle-orm/d1';
import * as t from './schema';
import { cfEnv } from '..';
export * as t from './schema';

export const db: () => DrizzleD1Database<typeof t> = () => {
  return d1(cfEnv.getStore()!.CF_D1_DB, { schema: t });
};
