import { photos } from './photos';
import { collections } from './collections';
import { tags } from './tags';
import { authTest, auth } from './auth';
import { passkeys } from './passkeys';
import { P, router } from './trpc';

export const combinedRouter = router({
  '': P.public.query(async () => {
    return { 'env': process.env };
  }),

  photos,
  collections,
  tags,
  auth,
  authTest,
  passkeys,
})


export type AppRouter = typeof combinedRouter;
