import { defineConfig } from 'drizzle-kit';
import { Glob } from 'bun';

// Find file ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite" and use it as the database file
const base = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/';
const dbFilesFound = Array.from(new Glob('*.sqlite').scanSync(base));

if (dbFilesFound.length === 0) {
  throw new Error('No database file found');
} else if (dbFilesFound.length > 1) {
  throw new Error('Multiple database files found');
}

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: base + dbFilesFound[0],
  },
});
