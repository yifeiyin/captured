import { router, P } from './trpc';

import { z } from "zod";
import { db, t } from '../db'
import { eq } from 'drizzle-orm'


export const tags = router({
  all: P.public.query(async () => {
    return db().select({
      id: t.tags.id,
      name: t.tags.name,
      photosCount: db().$count(t.photoTags, eq(t.photoTags.tagId, t.tags.id)).as("photosCount"),
    }).from(t.tags);
  }),

  update: P.auth
    .input(z.object({ id: z.number(), name: z.string() }))
    .mutation(async (opts) => {
      await db().update(t.tags).set({ name: opts.input.name }).where(eq(t.tags.id, opts.input.id));
      return { message: 'OK' };
    }),

  add: P.auth.input(z.string()).mutation(async (opts) => {
    return (await db().insert(t.tags).values({ name: opts.input }).returning({ id: t.tags.id }))[0];
  }),

  delete: P.auth.input(z.number()).mutation(async (opts) => {
    await db().delete(t.tags).where(eq(t.tags.id, opts.input));
    return { message: 'OK' };
  }),
})
