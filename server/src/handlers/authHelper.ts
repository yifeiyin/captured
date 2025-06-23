import { z } from 'zod';
import {
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';

export const RegistrationResponseJSONSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    attestationObject: z.string(),
    authenticatorData: z.string().optional(),
    transports: z
      .array(
        z.enum([
          'ble',
          'cable',
          'hybrid',
          'internal',
          'nfc',
          'smart-card',
          'usb',
        ])
      )
      .optional(),
    publicKeyAlgorithm: z.number().optional(),
    publicKey: z.string().optional(),
  }),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  clientExtensionResults: z.record(z.string(), z.any()),
  type: z.enum(['public-key']),
});

type _RegistrationResponseJSONType = z.infer<
  typeof RegistrationResponseJSONSchema
>;

const _assertSameType: _RegistrationResponseJSONType =
  {} as RegistrationResponseJSON;
const _assertSameType2: RegistrationResponseJSON =
  {} as _RegistrationResponseJSONType;

export const AuthenticationResponseJSONSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  clientExtensionResults: z.record(z.string(), z.any()),
  type: z.enum(['public-key']),
});

type _AuthenticationResponseJSONType = z.infer<
  typeof AuthenticationResponseJSONSchema
>;
const _assertSameType3: _AuthenticationResponseJSONType =
  {} as AuthenticationResponseJSON;
const _assertSameType4: AuthenticationResponseJSON =
  {} as _AuthenticationResponseJSONType;
