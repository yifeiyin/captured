import { router, P } from './trpc';

import { z } from "zod";
import { db, t } from '../db'
import { count, eq, isNull } from 'drizzle-orm'


export const collections = router({
  list: P.public.query(async () => {
    return {
      collections: await db().select({
        id: t.collections.id,
        name: t.collections.name,
        count: count(t.photos.id),
      })
        .from(t.collections)
        .leftJoin(t.photos, eq(t.photos.collectionId, t.collections.id))
        .groupBy(t.collections.id),

      photoWithNoCollection: await db().select({ count: count() }).from(t.photos).where(isNull(t.photos.collectionId)),
    }
  }),

  get: P.public.input(z.number()).query(async (opts) => {
    return await db().query.collections.findFirst({
      where: eq(t.collections.id, opts.input),
      with: { photos: true },
    });
  }),

  update: P.auth
    .input(z.object({ id: z.number(), name: z.string() }))
    .mutation(async (opts) => {
      await db().update(t.collections).set({ name: opts.input.name }).where(eq(t.collections.id, opts.input.id));
      return { message: 'OK' };
    }),

  add: P.auth.input(z.string()).mutation(async (opts) => {
    return (await db().insert(t.collections).values({ name: opts.input }).returning({ id: t.collections.id }))[0];
  }),

  delete: P.auth.input(z.number()).mutation(async (opts) => {
    await db().delete(t.collections).where(eq(t.collections.id, opts.input));
    return { message: 'OK' };
  }),
})
