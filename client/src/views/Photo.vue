<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { trpc } from '../helper/fetcher';
import { computed, ref } from 'vue';
import CapturedImage from '@/components/CapturedImage.vue';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { usePermissionStore } from '@/helper/stores';

const photoId = Number(useRoute().params.id);
const router = useRouter();
const item = useStorage<Awaited<ReturnType<typeof trpc.photos.get.query>>>(`photo-${photoId}`, null, undefined, { serializer: StorageSerializers.object });

const possibleCollections = ref<{ name: string, id: number }[]>([]);

const tags = ref<{ name: string, id: number, selected: boolean }[]>([]);

const inputs = ref<{ description: string, collection: number, tags: string[] }>({ description: '', collection: 0, tags: [] });

const permission = usePermissionStore();
permission.$subscribe(() => {
  fetchPhoto();
});


const error = ref('');

function fetchPhoto() {
  trpc.photos.get.query(photoId).then((data) => {
    item.value = data;
    inputs.value.description = data.description;
    inputs.value.collection = data.collection?.id || 0;
    inputs.value.tags = [];
  }).catch((err) => {
    if (err.message === 'Photo not found') {
      localStorage.removeItem(`photo-${photoId}`);
      error.value = 'Photo not found';
    }
  });

  if (permission.adminView) {
    trpc.photos.getTags.query(photoId).then((data) => {
      tags.value = data;
    });

    trpc.collections.list.query().then((data) => {
      possibleCollections.value = data.collections.map((c) => ({ name: c.name, id: c.id }));
    }).catch(() => {
      possibleCollections.value = [];
    })
  }
}

fetchPhoto();

async function updateTag(tagId: number, selected: boolean) {
  await trpc.photos.updateTags.mutate({ photoId, tagId, selected });
  fetchPhoto();
}

async function deletePhoto(id: number) {
  await trpc.photos.delete.mutate(id);
  localStorage.removeItem(`photo-${photoId}`);
  router.push('/');
}

async function save() {
  await trpc.photos.update.mutate({
    id: item.value!.id,
    description: inputs.value.description,
    collection: inputs.value.collection || null,
  });

  fetchPhoto();
}

const changed = computed(() => {
  if (!item.value) return true;
  return (item.value.description !== inputs.value.description) ||
    ((item.value.collection?.id ?? 0) !== inputs.value.collection);
});

const newCollectionOrTag = ref('');

const createNew = async (type: 'collection' | 'tag') => {
  if (newCollectionOrTag.value.trim() === '') return;

  if (type === 'collection') {
    const newCollectionId = (await trpc.collections.add.mutate(newCollectionOrTag.value)).id;
    await trpc.photos.update.mutate({ id: photoId, collection: newCollectionId, description: item.value?.description });
  } else {
    const newTagId = (await trpc.tags.add.mutate(newCollectionOrTag.value)).id;
    await trpc.photos.updateTags.mutate({ photoId, tagId: newTagId, selected: true });
  }

  newCollectionOrTag.value = '';
  fetchPhoto();
};

</script>

<template>
    <div v-if="error" class="p-4 m-auto w-fit bg-red-900/50 rounded-md text-center">{{ error }}</div>

    <div v-if="item" class="flex-1 flex flex-col justify-center items-center">
    <div v-if="permission.adminView" class="border-2 rounded-xl p-4 m-4 flex flex-col gap-1 text-center">

      <div class="flex gap-2 m-auto">
        <button class="button is-danger" @click="deletePhoto(item.id)">Delete</button>
        <button class="button is-success" :disabled="!changed" @click="save">Save</button>
      </div>

      <div class="field">
        <label class="label">Description</label>
        <input class="input is-primary w-80 m-auto" type="text" v-model="inputs.description" @keyup.enter="save" />
      </div>

      <div class="field">
        <label class="label">Collection</label>
        <select class="select input is-primary w-80 m-auto" v-model="inputs.collection">
          <option :value="0">(No Collection)</option>
          <option v-for="c of possibleCollections" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="field">
        <label class="label">Tags</label>
        <div class="flex flex-row flex-wrap gap-1 justify-center items-center">
          <span v-for="tag of tags" :key="tag.id" class="rounded-sm p-2 m-2 border-2 border-transparent hover:border-white transition" @click="updateTag(tag.id, !tag.selected)">
            {{ tag.name }} {{ tag.selected ? '✓' : '' }}
          </span>
        </div>
      </div>

      <div class="field has-addons m-auto">
        <div class="control">
          <input class="input is-primary" type="text" placeholder="Name" v-model="newCollectionOrTag" />
        </div>
        <div class="control"><button class="button is-primary" @click="createNew('collection')" :disabled="!newCollectionOrTag">collection</button></div>
        <div class="control"><button class="button is-primary" @click="createNew('tag')" :disabled="!newCollectionOrTag">tag</button></div>
      </div>

    </div>

    <div class="mx-2">
      <CapturedImage :image="item" :size="0" />
    </div>

    <div class="">
      {{ item.description }}
    </div>
  </div>
</template>
