import { router, P } from './trpc';

import { z } from "zod";
import { db, t } from '../db'
import { eq, and } from 'drizzle-orm'
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { SignJWT, jwtVerify } from 'jose'
import { AuthenticationResponseJSONSchema, RegistrationResponseJSONSchema } from './authHelper';
import { cfEnv } from '..';


const config = () => {
  const env = cfEnv.getStore()!;
  const secret = env.secret;
  if (!secret) {
    throw new Error('Secret is empty. For local development, make sure to create .dev.vars file');
  }
  return {
    rpOrigin: env.rpOrigin,
    rpName: env.rpName,
    rpID: env.rpId,
    jwt: {
      secret: new TextEncoder().encode(secret),
      alg: 'HS256',
    }
  }
}


export const authTest = router({
  registrationOptions:
    P.auth.input(
      z.object({
        userName: z.string(),
        attestationType: z.enum(['direct', 'enterprise', 'none']),
        residentKey: z.enum(['discouraged', 'required', 'preferred']),
        userVerification: z.enum(['discouraged', 'required', 'preferred']),
        authenticatorAttachment: z.enum(['platform', 'cross-platform']),
      })
    ).query(
      async (opts) => {
        const options = await generateRegistrationOptions({
          rpName: config().rpName,
          rpID: config().rpID,
          userName: opts.input.userName,
          attestationType: opts.input.attestationType,
          authenticatorSelection: {
            residentKey: opts.input.residentKey,
            userVerification: opts.input.userVerification,
            authenticatorAttachment: opts.input.authenticatorAttachment,
          },
        });

        const jwt = await new SignJWT({ userName: opts.input.userName, challenge: options.challenge })
          .setProtectedHeader({ alg: config().jwt.alg })
          .setExpirationTime('5m')
          .setAudience('testing.regVerify')
          .sign(config().jwt.secret)

        return { options, jwt };
      }),

  registrationVerify:
    P.auth.input(
      z.object({
        response: RegistrationResponseJSONSchema,
        jwt: z.string(),
        requireUserPresence: z.boolean(),
        requireUserVerification: z.boolean(),
      })
    ).mutation(async (opts) => {
      const verifiedJwt = await jwtVerify(opts.input.jwt, config().jwt.secret, { algorithms: [config().jwt.alg], audience: 'testing.regVerify' });
      const payload = z.object({ userName: z.string(), challenge: z.string() }).parse(verifiedJwt.payload);

      const verification = await verifyRegistrationResponse({
        response: opts.input.response,
        expectedChallenge: payload.challenge,
        expectedOrigin: config().rpOrigin,
        expectedRPID: config().rpID,
        requireUserPresence: opts.input.requireUserPresence,
        requireUserVerification: opts.input.requireUserVerification,
      })

      if (!verification.registrationInfo) {
        return { verified: false, fullResponse: verification };
      }
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      await db().insert(t.passkeys).values({
        keyId: credential.id,
        publicKey: convertToString(credential.publicKey),
        counter: credential.counter,
        transports: (credential.transports ?? []).join(','),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        userName: payload.userName,
      });

      return { verified: verification.verified, fullResponse: verification };
    }),

  authenticationOptions:
    P.public
      .input(
        z.object({
          userName: z.string(),
          userVerification: z.enum(['discouraged', 'required', 'preferred']),
        })
      ).query(async (opts) => {
        const passKeyStored = await db().select().from(t.passkeys).where(eq(t.passkeys.userName, opts.input.userName));

        // Note: return error if passKeyStored is empty

        const options = await generateAuthenticationOptions({
          rpID: config().rpID,
          allowCredentials: passKeyStored.map((passkey) => ({
            id: passkey.keyId,
            // transports: passkey.transports, // not adding this for now
          })),
          userVerification: opts.input.userVerification,
        });

        const jwt = await new SignJWT({ userName: opts.input.userName, challenge: options.challenge })
          .setProtectedHeader({ alg: config().jwt.alg })
          .setExpirationTime('5m')
          .setAudience('testing.authVerify')
          .sign(config().jwt.secret)


        return { options, jwt };
      }),

  authenticationVerify:
    P.public.input(
      z.object({
        response: AuthenticationResponseJSONSchema,
        jwt: z.string(),
        requireUserVerification: z.boolean(),
      })
    ).mutation(async (opts) => {
      const verifiedJwt = await jwtVerify(opts.input.jwt, config().jwt.secret, { algorithms: [config().jwt.alg], audience: 'testing.authVerify' });
      const payload = z.object({ userName: z.string(), challenge: z.string() }).parse(verifiedJwt.payload);

      const passKeyStored = (await db().select().from(t.passkeys).where(
        and(
          eq(t.passkeys.userName, payload.userName),
          eq(t.passkeys.keyId, opts.input.response.id),
        ))
      )[0];

      // Note: return error if passKeyStored is empty

      const verification = await verifyAuthenticationResponse({
        response: opts.input.response,
        expectedChallenge: payload.challenge,
        expectedOrigin: config().rpOrigin,
        expectedRPID: config().rpID,
        requireUserVerification: opts.input.requireUserVerification,
        credential: {
          id: passKeyStored.keyId,
          publicKey: convertToUint8Array(passKeyStored.publicKey),
          counter: passKeyStored.counter,
          // transports: passKeyStored.transports, // not adding this for now
        }
      });

      return { verified: verification.verified, fullResponse: verification };
    }),
});

function convertToUint8Array(str: string): Uint8Array {
  // decode base64 to arbitrary bytes
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

function convertToString(uint8: Uint8Array): string {
  // encode arbitrary bytes to to base64
  return btoa(String.fromCharCode(...uint8));
}

export const auth = router({
  currentSignInOption:
    P.public.query(async () => {
      const passKeyStored = await db().query.passkeys.findMany();
      if (passKeyStored.length > 0) {
        return 'passkey';
      } else {
        return 'token';
      }
    }),

  registrationOptions:
    P.auth.query(
      async () => {
        const existingPassKey = await db().query.passkeys.findMany();

        const options = await generateRegistrationOptions({
          rpName: config().rpName,
          rpID: config().rpID,
          userName: 'user',
          attestationType: 'none',
          authenticatorSelection: {
            residentKey: 'discouraged',
            userVerification: 'discouraged',
            authenticatorAttachment: 'cross-platform',
          },
          excludeCredentials: existingPassKey.map((passkey) => ({
            id: passkey.keyId,
          })),
        });

        const jwt = await new SignJWT({ challenge: options.challenge })
          .setProtectedHeader({ alg: config().jwt.alg })
          .setExpirationTime('5m')
          .setAudience('regVerify')
          .sign(config().jwt.secret)

        return { options, jwt };
      }),

  registrationVerify:
    P.auth.input(
      z.object({
        response: RegistrationResponseJSONSchema,
        jwt: z.string(),
      })
    ).mutation(async (opts) => {
      const verifiedJwt = await jwtVerify(opts.input.jwt, config().jwt.secret, { algorithms: [config().jwt.alg], audience: 'regVerify' });
      const payload = z.object({ challenge: z.string() }).parse(verifiedJwt.payload);

      const verification = await verifyRegistrationResponse({
        response: opts.input.response,
        expectedChallenge: payload.challenge,
        expectedOrigin: config().rpOrigin,
        expectedRPID: config().rpID,
        requireUserPresence: true,
        requireUserVerification: false,
      })

      if (!verification.verified) {
        return { token: null };
      }
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo!;

      await db().insert(t.passkeys).values({
        keyId: credential.id,
        publicKey: convertToString(credential.publicKey),
        counter: credential.counter,
        transports: (credential.transports ?? []).join(','),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        userName: 'user',
      });

      const jwt = await new SignJWT({ keyId: credential.id })
        .setProtectedHeader({ alg: config().jwt.alg })
        .setExpirationTime('20h')
        .setIssuedAt()
        .setAudience('app')
        .sign(config().jwt.secret);

      return { token: { jwt, expiresAt: Date.now() + 20 * 60 * 60 * 1000 } };

    }),

  authenticationOptions:
    P.public
      .query(async (opts) => {
        const passKeyStored = await db().query.passkeys.findMany();

        // Note: return error if passKeyStored is empty

        const options = await generateAuthenticationOptions({
          rpID: config().rpID,
          allowCredentials: passKeyStored.map((passkey) => ({
            id: passkey.keyId,
            // transports: passkey.transports, // not adding this for now
          })),
          userVerification: 'discouraged',
        });

        const jwt = await new SignJWT({ challenge: options.challenge })
          .setProtectedHeader({ alg: config().jwt.alg })
          .setExpirationTime('5m')
          .setAudience('authVerify')
          .sign(config().jwt.secret)


        return { options, jwt };
      }),

  authenticationVerify:
    P.public.input(
      z.object({
        response: AuthenticationResponseJSONSchema,
        jwt: z.string(),
      })
    ).mutation(async (opts) => {
      const verifiedJwt = await jwtVerify(opts.input.jwt, config().jwt.secret, { algorithms: [config().jwt.alg], audience: 'authVerify' });
      const payload = z.object({ challenge: z.string() }).parse(verifiedJwt.payload);

      const passKeyStored = (await db().select().from(t.passkeys).where(
        eq(t.passkeys.keyId, opts.input.response.id),
      )
      )[0];

      // Note: return error if passKeyStored is empty

      const verification = await verifyAuthenticationResponse({
        response: opts.input.response,
        expectedChallenge: payload.challenge,
        expectedOrigin: config().rpOrigin,
        expectedRPID: config().rpID,
        requireUserVerification: false,
        credential: {
          id: passKeyStored.keyId,
          publicKey: convertToUint8Array(passKeyStored.publicKey),
          counter: passKeyStored.counter,
          // transports: passKeyStored.transports, // not adding this for now
        }
      });


      if (!verification.verified) {
        return { token: null };
      }

      if (verification.authenticationInfo) {
        await db().update(t.passkeys)
          .set({ counter: verification.authenticationInfo.newCounter })
          .where(eq(t.passkeys.keyId, passKeyStored.keyId));
      }

      const jwt = await new SignJWT({ keyId: passKeyStored.keyId })
        .setProtectedHeader({ alg: config().jwt.alg })
        .setExpirationTime('20h')
        .setIssuedAt()
        .setAudience('app')
        .sign(config().jwt.secret);

      return { token: { jwt, expiresAt: Date.now() + 20 * 60 * 60 * 1000 } };
    }),


  authenticateWithToken:
    P.public.input(
      z.string()
    ).mutation(async (opts) => {
      if (!opts.input) {
        return { token: null };
      }

      const passKeyStored = await db().query.passkeys.findMany();

      if (passKeyStored.length === 0 && opts.input === new TextDecoder().decode(config().jwt.secret)) {
        const jwt = await new SignJWT({ keyId: 'admin' })
          .setProtectedHeader({ alg: config().jwt.alg })
          .setExpirationTime('20h')
          .setIssuedAt()
          .setAudience('app')
          .sign(config().jwt.secret);

        return { token: { jwt, expiresAt: Date.now() + 20 * 60 * 60 * 1000 } };
      }

      return { token: null };
    }),
});

