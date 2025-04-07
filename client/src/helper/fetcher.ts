import { type TRPCClient, createTRPCClient, httpBatchLink } from '@trpc/client';
// @ts-nocheck
import type { AppRouter } from '../../../server/src/handlers';

// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
export const trpc: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_BACKEND_URL}/api/`,
      headers() {
        const token = localStorage.getItem('authToken');
        const tokenExpired = Number.parseInt(localStorage.getItem('authTokenExpiresAt') ?? '0') < Date.now();
        if (!token || tokenExpired) {
          return {};
        }
        return {
          Authorization: `Bearer ${token}`,
        }
      }
    }),
  ],
});
