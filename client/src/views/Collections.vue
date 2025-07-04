<script setup lang="ts">
import { ref } from 'vue';
import { trpc } from '../helper/fetcher';
import { useStorage } from '@vueuse/core';
import { usePermissionStore } from '@/helper/stores';

const collections = useStorage<
  Awaited<ReturnType<typeof trpc.collections.list.query>>
>(`collections`, { collections: [], photoWithNoCollection: [] });

function load() {
  trpc.collections.list
    .query()
    .then((res) => {
      collections.value = res;
      collections.value.collections.unshift({
        id: 0,
        name: 'none',
        count: res.photoWithNoCollection[0].count,
      });
    })
    .catch(() => {
      collections.value = { collections: [], photoWithNoCollection: [] };
    });
}

const permissionStore = usePermissionStore();

const newCollectionName = ref<string>('');

function create() {
  trpc.collections.add.mutate(newCollectionName.value).then(() => {
    load();
    newCollectionName.value = '';
  });
}

function remove(id: number) {
  trpc.collections.delete.mutate(id).then(load);
}

function rename(id: number) {
  trpc.collections.update
    .mutate({ id, name: newCollectionName.value })
    .then(load);
}

load();
</script>

<template>
  <div class="flex-1 flex flex-col gap-1 justify-center items-center">
    <div class="flex flex-row flex-wrap gap-1 justify-center items-center">
      <template v-if="collections">
        <template v-for="item of collections.collections" :key="item.id">
          <RouterLink
            :to="`/collections/${item.name}`"
            class="rounded-sm p-2 m-2 border-2 border-transparent hover:border-white transition"
          >
            <span
              v-view-transition-name="'collection' + item.name"
              class="font-bold"
              >{{ item.name }}</span
            >
            <span class="">({{ item.count }})</span>
          </RouterLink>
          <div v-if="permissionStore.adminView">
            <button
              class="button mr-1 is-info is-small"
              :disabled="!newCollectionName || item.id === 0"
              @click="rename(item.id)"
            >
              R
            </button>
            <button
              class="button mr-1 is-danger is-small"
              :disabled="item.id === 0"
              @click="remove(item.id)"
            >
              –
            </button>
          </div>
        </template>
      </template>
      <div v-if="permissionStore.adminView">
        <button
          class="button mr-1 is-success is-small"
          :disabled="!newCollectionName"
          @click="create"
        >
          +
        </button>
      </div>
    </div>

    <div v-if="permissionStore.adminView">
      <input
        v-model="newCollectionName"
        type="text"
        class="input is-link"
        placeholder="Rename or create new collection"
        @keyup.enter="create"
      />
    </div>
  </div>
</template>
