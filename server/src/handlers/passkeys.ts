import { router, P } from './trpc';

import { z } from "zod";
import { db, t } from '../db'
import { count, eq, isNull } from 'drizzle-orm'


export const passkeys = router({
  list: P.auth.query(async () => {
    return db().query.passkeys.findMany();
  }),

  update: P.auth
    .input(z.object({ id: z.number(), friendlyName: z.string() }))
    .mutation(async (opts) => {
      await db().update(t.passkeys).set({ friendlyName: opts.input.friendlyName }).where(eq(t.passkeys.id, opts.input.id));
      return { message: 'OK' };
    }),

  delete: P.auth.input(z.number()).mutation(async (opts) => {
    await db().delete(t.passkeys).where(eq(t.passkeys.id, opts.input));
    return { message: 'OK' };
  }),
})
