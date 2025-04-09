<script setup lang="ts">
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { trpc } from '../../helper/fetcher';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

const passkeys = ref<Awaited<ReturnType<typeof trpc.passkeys.list.query>>>([]);

function load() {
  trpc.passkeys.list.query().then((data) => {
    passkeys.value = data;
  }).catch(() => {
    passkeys.value = [];
  });
}

load();

const authToken = useStorage('authToken', '');
const authTokenExpiresAt = useStorage('authTokenExpiresAt', 0);

const authenticate = async () => {
  let response;
  if (await trpc.auth.currentSignInOption.query() === 'token') {
    const token = prompt('Enter token');
    if (!token) return;
    response = await trpc.auth.authenticateWithToken.mutate(token);
  } else {
    const authOptions = await trpc.auth.authenticationOptions.query();
    const authenticationResponse = await startAuthentication({ optionsJSON: authOptions.options });
    response = await trpc.auth.authenticationVerify.mutate({
      response: authenticationResponse,
      jwt: authOptions.jwt,
    });
  }

  if (response.token) {
    authTokenExpiresAt.value = response.token.expiresAt;
    authToken.value = response.token.jwt;
  }

  load();
};


const registerNewKey = async () => {
  const regOptions = await trpc.auth.registrationOptions.query();

  const registrationResponse = await startRegistration({ optionsJSON: regOptions.options });

  const response = await trpc.auth.registrationVerify.mutate({
    response: registrationResponse,
    jwt: regOptions.jwt,
  });

  if (response.token) {
    authTokenExpiresAt.value = response.token.expiresAt;
    authToken.value = response.token.jwt;
  }

  load();
};

const deletePasskey = async (keyId: number) => {
  await trpc.passkeys.delete.mutate(keyId);
  load();
};

const editPasskey = async (keyId: number) => {
  const newName = prompt('Enter new name');
  if (!newName) return;
  await trpc.passkeys.update.mutate({ id: keyId, friendlyName: newName });
  load();
};

const shortId = (id: string) => id.slice(0, Math.round(id.length * 0.05)) + '...' + id.slice(-Math.round(id.length * 0.05));

const logout = () => {
  authToken.value = '';
  authTokenExpiresAt.value = 0;
};

const purgeCache = () => {
  Object.keys(localStorage).forEach((key) => {
    if (!['adminView', 'authToken', 'authTokenExpiresAt'].includes(key)) {
      localStorage.removeItem(key);
    }
  });
}

</script>

<template>
  <div class="">
    <div class="border rounded-sm mx-auto my-4 p-4 text-center w-80 text-lg">
      <div v-if="authToken">
        <p>Authenticated.</p>
        <p v-if="authTokenExpiresAt > Date.now()">
          Token will expire in {{ ((authTokenExpiresAt - Date.now()) / 3600000).toFixed(2) }} hours.
        </p>
        <p v-else>
          Token has expired.
        </p>
      </div>
      <div v-else>
        <p>No auth token found.</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 justify-center">
      <button class="button is-primary" @click="authenticate()">Sign In</button>
      <button class="button is-warning" @click="logout()">Logout</button>
      <button class="button" @click="registerNewKey()">Register New Passkey</button>
      <button class="button" @click="purgeCache()">Purge Cached Data</button>
      <button class="button" @click="load()">Refresh</button>
    </div>

    <div class="table-container">
      <table class="table mx-auto my-5">
        <thead>
          <tr>
            <th class="font-bold">Friendly Name</th>
            <th class="font-bold">Key ID</th>
            <th class="font-bold">Public Key</th>
            <th class="font-bold">Username</th>
            <th class="font-bold">Device Type</th>
            <th class="font-bold">Transports</th>
            <th class="font-bold">Backed Up</th>
            <th class="font-bold">Counter</th>
            <th class="font-bold">Created At</th>
            <th class="font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="passkey in passkeys" :key="passkey.id">
            <td>
              {{ passkey.friendlyName }}
              <span class="hover:underline cursor-pointer" @click="editPasskey(passkey.id)">✏️</span>
            </td>
            <td :title="passkey.keyId">{{ shortId(passkey.keyId) }}</td>
            <td :title="passkey.publicKey">{{ shortId(passkey.publicKey) }}</td>
            <td>{{ passkey.userName }}</td>
            <td>{{ passkey.deviceType }}</td>
            <td>{{ passkey.transports }}</td>
            <td>{{ passkey.backedUp }}</td>
            <td>{{ passkey.counter }}</td>
            <td>{{ passkey.createdAt }}</td>
            <td>
              <button class="button is-danger" @click="deletePasskey(passkey.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
