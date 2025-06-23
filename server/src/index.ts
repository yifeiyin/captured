import {
  type FetchCreateContextFnOptions,
  fetchRequestHandler,
} from '@trpc/server/adapters/fetch';
import { combinedRouter } from './handlers';
import { AsyncLocalStorage } from 'node:async_hooks';

export const cfEnv = new AsyncLocalStorage<Env>();

export default {
  async fetch(request: Request, env: Env, _ctx): Promise<Response> {
    // Unfortunately, we have to proxy the images through the worker during local development
    // https://github.com/cloudflare/workers-sdk/issues/3687
    if (env.proxyR2 && new URL(request.url).pathname.startsWith('/r2/')) {
      const key = new URL(request.url).pathname.split('/r2/')[1];
      const file = await env.CF_R2_BUCKET.get(key);
      if (!file) return new Response('ASSETS not found', { status: 404 });
      const headers = new Headers();
      for (const [key, value] of Object.entries(file.httpMetadata ?? {}))
        headers.append(key, value);
      return new Response(file.body, { headers });
    }

    if (!new URL(request.url).pathname.startsWith('/api/')) {
      return env.CF_ASSETS.fetch(request);
    }

    if (env.allowCors && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return cfEnv.run(env, async () => {
      // https://trpc.io/docs/server/adapters/fetch#cloudflare-worker
      const response = await fetchRequestHandler({
        endpoint: '/api',
        req: request,
        router: combinedRouter,
        createContext: (opts: FetchCreateContextFnOptions) => {
          const auth = opts.req.headers.get('authorization');
          return {
            token: auth ? auth.replace('Bearer ', '') : null,
          };
        },
      });

      if (env.allowCors) {
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      return response;
    });
  },
} satisfies ExportedHandler<Env>;
