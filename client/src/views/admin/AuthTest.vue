<script setup lang="ts">
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { trpc } from '../../helper/fetcher';
import { ref } from 'vue';

const username = ref('');
const attestationType = ref('none');
const authenticatorAttachment = ref('cross-platform');
const residentKey = ref('preferred');
const userVerification = ref('preferred');
const requireUserPresence = ref(true);
const requireUserVerification = ref(true);

const register = async () => {
  const regOptions = await trpc.authTest.registrationOptions.query({
    userName: username.value,
    attestationType: attestationType.value as any,
    authenticatorAttachment: authenticatorAttachment.value as any,
    residentKey: residentKey.value as any,
    userVerification: userVerification.value as any,
  });

  const registrationResponse = await startRegistration({ optionsJSON: regOptions.options });

  const result = await trpc.authTest.registrationVerify.mutate({
    response: registrationResponse,
    jwt: regOptions.jwt,
    requireUserPresence: requireUserPresence.value,
    requireUserVerification: requireUserVerification.value,
  });

  console.log(result);
};

const authenticate = async () => {
  const authOptions = await trpc.authTest.authenticationOptions.query(
    {
      userName: username.value,
      userVerification: userVerification.value as any,
    });

  const authenticationResponse = await startAuthentication({ optionsJSON: authOptions.options });

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
      <input class="input is-primary" type="text" v-model="username" />
    </div>

    <div class="field">
      <label class="label">Attestation Type</label>
      <select class="select input is-primary" v-model="attestationType">
        <option value="none">None</option>
        <option value="enterprise">Enterprise</option>
        <option value="direct">Direct</option>
      </select>
    </div>

    <div class="field">
      <label class="label">Authenticator Attachment</label>
      <select class="select input is-primary" v-model="authenticatorAttachment">
        <option value="cross-platform">Cross-platform</option>
        <option value="platform">Platform</option>
      </select>
    </div>

    <div class="field">
      <label class="label">Resident Key</label>
      <select class="select input is-primary" v-model="residentKey">
        <option value="preferred">Preferred</option>
        <option value="required">Required</option>
        <option value="discouraged">Discouraged</option>
      </select>
    </div>

    <div class="field">
      <label class="label">User Verification (auth)</label>
      <select class="select input is-primary" v-model="userVerification">
        <option value="preferred">Preferred</option>
        <option value="required">Required</option>
        <option value="discouraged">Discouraged</option>
      </select>
    </div>

    <div class="field">
      <label class="checkbox">
        <input type="checkbox" v-model="requireUserPresence" />
        Require User Presence
      </label>
    </div>

    <div class="field">
      <label class="checkbox">
        <input type="checkbox" v-model="requireUserVerification" />
        Require User Verification (auth)
      </label>
    </div>

    <div class="buttons">
      <button class="button is-primary" @click="register">Register</button>
      <button class="button is-primary" @click="authenticate">Authenticate</button>
    </div>
  </div>

  <div class="">

  </div>
</template>
