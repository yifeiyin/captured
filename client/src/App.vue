<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { usePermissionStore } from './helper/stores';
import { useStorage } from '@vueuse/core';
import { computed } from 'vue';

const permissionStore = usePermissionStore();
const { toggleAdminView: toggleAdmin } = permissionStore;


const authTokenExpiresAt = useStorage('authTokenExpiresAt', 0);
const authenticated = computed(() => authTokenExpiresAt.value > Date.now());
const icon = computed(() => authenticated.value ? '🔐' : '🔒');
</script>

<template>
  <header class="flex gap-2 justify-center flex-wrap">
    <RouterLink class="text-center w-fit p-4" active-class="underline" to="/">All Photos</RouterLink>
    <RouterLink class="text-center w-fit p-4" active-class="underline" to="/collections">Collections</RouterLink>
    <RouterLink class="text-center w-fit p-4" active-class="underline" to="/tags">Tags</RouterLink>
    <template v-if="permissionStore.adminView">
      <RouterLink class="text-center w-fit p-4" active-class="underline" to="/auth">{{ icon }} Login & Credentials</RouterLink>
      <RouterLink class="text-center w-fit p-4" active-class="underline" to="/admin/upload">{{ icon }} Upload</RouterLink>
      <RouterLink class="text-center w-fit p-4" active-class="underline" to="/auth-test">{{ icon }} Passkey Testing</RouterLink>
    </template>

    <button class="text-center w-fit p-4 ml-auto" @click="toggleAdmin()">{{ icon }}</button>
  </header>

  <RouterView :key="$route.fullPath" />
</template>
🔐
<style scoped></style>
