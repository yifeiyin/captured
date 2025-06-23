import { defineConfig } from 'drizzle-kit';

// https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: Bun.env.accountId!,
    databaseId: Bun.env.databaseId!,
    token: Bun.env.token!,
  },
  // https://github.com/drizzle-team/drizzle-orm/issues/3728
  tablesFilter: ['/^(?!.*_cf_KV).*$/'],
});
