<script setup lang="ts">
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { trpc } from '../../helper/fetcher';
import { ref } from 'vue';

const username = ref('');
const attestationType = ref<'none' | 'direct' | 'enterprise'>('none');
const authenticatorAttachment = ref<'platform' | 'cross-platform'>(
  'cross-platform'
);
const residentKey = ref<'discouraged' | 'preferred' | 'required'>('preferred');
const userVerification = ref<'discouraged' | 'preferred' | 'required'>(
  'preferred'
);
const requireUserPresence = ref(true);
const requireUserVerification = ref(true);

const register = async () => {
  const regOptions = await trpc.authTest.registrationOptions.query({
    userName: username.value,
    attestationType: attestationType.value,
    authenticatorAttachment: authenticatorAttachment.value,
    residentKey: residentKey.value,
    userVerification: userVerification.value,
  });

  const registrationResponse = await startRegistration({
    optionsJSON: regOptions.options,
  });

  const result = await trpc.authTest.registrationVerify.mutate({
    response: registrationResponse,
    jwt: regOptions.jwt,
    requireUserPresence: requireUserPresence.value,
    requireUserVerification: requireUserVerification.value,
  });

  console.log(result);
};

const authenticate = async () => {
  const authOptions = await trpc.authTest.authenticationOptions.query({
    userName: username.value,
    userVerification: userVerification.value,
  });

  const authenticationResponse = await startAuthentication({
    optionsJSON: authOptions.options,
  });

  const result = await trpc.authTest.authenticationVerify.mutate({
    response: authenticationResponse,
    jwt: authOptions.jwt,
    requireUserVerification: requireUserVerification.value,
  });

  console.log(result);
};
</script>

<template>
  <div class="w-80 m-5">
    <div class="field">
      <label class="label">Username (auth)</label>
      <input v-model="username" class="input is-primary" type="text" />
    </div>

    <div class="field">
      <label class="label">Attestation Type</label>
      <select v-model="attestationType" class="select input is-primary">
        <option value="none">None</option>
        <option value="enterprise">Enterprise</option>
        <option value="direct">Direct</option>
      </select>
    </div>

    <div class="field">
      <label class="label">Authenticator Attachment</label>
      <select v-model="authenticatorAttachment" class="select input is-primary">
        <option value="cross-platform">Cross-platform</option>
        <option value="platform">Platform</option>
      </select>
    </div>

    <div class="field">
      <label class="label">Resident Key</label>
      <select v-model="residentKey" class="select input is-primary">
        <option value="preferred">Preferred</option>
        <option value="required">Required</option>
        <option value="discouraged">Discouraged</option>
      </select>
    </div>

    <div class="field">
      <label class="label">User Verification (auth)</label>
      <select v-model="userVerification" class="select input is-primary">
        <option value="preferred">Preferred</option>
        <option value="required">Required</option>
        <option value="discouraged">Discouraged</option>
      </select>
    </div>

    <div class="field">
      <label class="checkbox">
        <input v-model="requireUserPresence" type="checkbox" />
        Require User Presence
      </label>
    </div>

    <div class="field">
      <label class="checkbox">
        <input v-model="requireUserVerification" type="checkbox" />
        Require User Verification (auth)
      </label>
    </div>

    <div class="buttons">
      <button class="button is-primary" @click="register">Register</button>
      <button class="button is-primary" @click="authenticate">
        Authenticate
      </button>
    </div>
  </div>

  <div class=""></div>
</template>
