<script setup lang="ts">
import { ref } from 'vue';
import { trpc } from '../helper/fetcher';
import { useStorage } from '@vueuse/core';
import { usePermissionStore } from '@/helper/stores';

const tags = useStorage<Awaited<ReturnType<typeof trpc.tags.all.query>>>(`tags`, []);

function load() {
  trpc.tags.all.query().then((res) => {
    tags.value = res;
    newTagName.value = '';
  }).catch(() => {
    tags.value = [];
  })
}

const permissionStore = usePermissionStore()

const newTagName = ref<string>('');
function create() {
  trpc.tags.add.mutate(newTagName.value).then(load);
}

function remove(id: number) {
  trpc.tags.delete.mutate(id).then(load);
}

function rename(id: number) {
  trpc.tags.update.mutate({ id, name: newTagName.value }).then(load);
}

load();
</script>

<template>
  <div class="flex-1 flex flex-col gap-1 justify-center items-center">

    <div class="flex flex-row flex-wrap gap-1 justify-center items-center">
      <template v-if="tags">
        <span v-for="item of tags" :key="item.id" class="rounded-sm p-2 m-2 border-2 border-transparent hover:border-white transition">
          <RouterLink :to="`/tags/${item.name}`">
            <span class="font-bold" v-view-transition-name="'tag' + item.name">{{ item.name }}</span> <span class="">({{ item.photosCount }})</span>
          </RouterLink>
          <div v-if="permissionStore.adminView">
            <button class="button mr-1 is-info is-small" :disabled="!newTagName" @click="rename(item.id)">R</button>
            <button class="button mr-1 is-danger is-small" @click="remove(item.id)">–</button>
          </div>
        </span>
      </template>
      <div v-if="permissionStore.adminView">
        <button class="button mr-1 is-success is-small" :disabled="!newTagName" @click="create">+</button>
      </div>
    </div>

    <div v-if="permissionStore.adminView">
      <input type="text" class="input is-link" placeholder="Rename or create new tag" v-model="newTagName" @keyup.enter="create" />
    </div>

  </div>
</template>
