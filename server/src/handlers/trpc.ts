import { initTRPC, TRPCError } from '@trpc/server';

export interface Context_ {
  token: string | null;
}

const trpc = initTRPC.context<Context_>().create();
export const router = trpc.router;

// P for trpc Procedure
export const P = {
  public: trpc.procedure,
  auth: trpc.procedure.use(async (opts) => {
    if (!opts.ctx.token) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return opts.next({
      ctx: {
        token: opts.ctx.token,
      },
    });
  }),
};
