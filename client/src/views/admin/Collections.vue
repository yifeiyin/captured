<script setup lang="ts">
import { trpc } from '../../helper/fetcher';
import { ref } from 'vue';

const data = ref<Awaited<ReturnType<typeof trpc.collections.list.query>>>();

function load() {
  trpc.collections.list.query().then((res) => {
    data.value = res;
    data.value.collections.unshift({
      id: 0,
      name: '(No Collection)',
      count: res.photoWithNoCollection[0].count,
    });
  });
}

load();

const newCollectionInput = ref<string>('');

function create() {
  trpc.collections.add.mutate(newCollectionInput.value).then(() => {
    load();
    newCollectionInput.value = '';
  });
}

function remove(id: number) {
  trpc.collections.delete.mutate(id).then(() => {
    load();
  });
}

function update(id: number, name: string) {
  trpc.collections.update.mutate({ id, name }).then(() => {
    load();
  });
}
</script>

<template>

  <div class="flex gap-1 mx-auto my-5 ">
    <div class="button mr-8" @click="load">Refresh</div>
    <input type="text" class="input is-link" placeholder="New collection name" v-model="newCollectionInput" @keyup.enter="create" />
    <button class="button is-success" @click="create">Create</button>
  </div>

  <div v-if="data" class="flex flex-col gap-1">
    <div v-for="item of data.collections" :key="item.id" class="rounded-sm border p-2 m-2 grid items-center grid-[auto-flow] gap-4 grid-cols-[auto_2fr_1fr_auto]">
      <div class="font-bold">#{{ item.id }}</div>
      <input type="text" class="input" placeholder="New name" :disabled="item.id === 0" v-model="item.name" @keyup.enter="update(item.id, item.name)" />
      <div class="">photos: {{ item.count }}</div>
      <div class="place-self-end">
        <button class="button is-danger" :disabled="item.id === 0" @click="remove(item.id)">Delete</button>
      </div>
    </div>
  </div>

</template>
