<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { trpc } from '../helper/fetcher';
import { computed, ref } from 'vue';
import CapturedImage from '@/components/CapturedImage.vue';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { usePermissionStore } from '@/helper/stores';

const props = defineProps<{ collection?: string; tag?: string }>();

const backRoute = computed(() => {
  if (props.collection && props.tag) {
    throw new Error('Only one of collection or tag can be set');
  }
  if (!props.collection && !props.tag) {
    return '/';
  }
  return props.collection
    ? `/collections/${props.collection}`
    : `/tags/${props.tag}`;
});

const photoId = Number(useRoute().params.id);
const router = useRouter();
const item = useStorage<Awaited<ReturnType<typeof trpc.photos.get.query>>>(
  `photo-${photoId}`,
  null,
  undefined,
  { serializer: StorageSerializers.object }
);

const possibleCollections = ref<{ name: string; id: number }[]>([]);

const tags = ref<{ name: string; id: number; selected: boolean }[]>([]);

const inputs = ref<{ description: string; collection: number; tags: string[] }>(
  { description: '', collection: 0, tags: [] }
);

const permission = usePermissionStore();
permission.$subscribe(() => {
  fetchPhoto();
});

type Photo = Awaited<ReturnType<typeof trpc.photos.list.query>>[number];

const photosList = useStorage<Photo[]>(
  `photos-${JSON.stringify(props)}`,
  [],
  undefined,
  { serializer: StorageSerializers.object }
);
const prevRoute = computed(() => {
  if (!photosList.value) return null;
  const index = photosList.value.findIndex((p) => p.id === photoId);
  const previous = photosList.value[index - 1]?.id;
  if (!previous) return null;
  return props.collection
    ? `/collections/${props.collection}/photos/${previous}`
    : props.tag
      ? `/tags/${props.tag}/photos/${previous}`
      : `/photos/${previous}`;
});
const nextRoute = computed(() => {
  if (!photosList.value) return null;
  const index = photosList.value.findIndex((p) => p.id === photoId);
  const next = photosList.value[index + 1]?.id;
  if (!next) return null;
  return props.collection
    ? `/collections/${props.collection}/photos/${next}`
    : props.tag
      ? `/tags/${props.tag}/photos/${next}`
      : `/photos/${next}`;
});

const error = ref('');

function fetchPhoto() {
  trpc.photos.get
    .query(photoId)
    .then((data) => {
      item.value = data;
      inputs.value.description = data.description;
      inputs.value.collection = data.collection?.id || 0;
      inputs.value.tags = [];
    })
    .catch((err) => {
      if (err.message === 'Photo not found') {
        localStorage.removeItem(`photo-${photoId}`);
        error.value = 'Photo not found';
      }
    });

  if (permission.adminView) {
    trpc.photos.getTags.query(photoId).then((data) => {
      tags.value = data;
    });

    trpc.collections.list
      .query()
      .then((data) => {
        possibleCollections.value = data.collections.map((c) => ({
          name: c.name,
          id: c.id,
        }));
      })
      .catch(() => {
        possibleCollections.value = [];
      });
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
  router.replace(backRoute.value);
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
  return (
    item.value.description !== inputs.value.description ||
    (item.value.collection?.id ?? 0) !== inputs.value.collection
  );
});

const newCollectionOrTag = ref('');

const createNew = async (type: 'collection' | 'tag') => {
  if (newCollectionOrTag.value.trim() === '') return;

  if (type === 'collection') {
    const newCollectionId = (
      await trpc.collections.add.mutate(newCollectionOrTag.value)
    ).id;
    await trpc.photos.update.mutate({
      id: photoId,
      collection: newCollectionId,
      description: item.value?.description,
    });
  } else {
    const newTagId = (await trpc.tags.add.mutate(newCollectionOrTag.value)).id;
    await trpc.photos.updateTags.mutate({
      photoId,
      tagId: newTagId,
      selected: true,
    });
  }

  newCollectionOrTag.value = '';
  fetchPhoto();
};
</script>

<template>
  <div
    v-if="error"
    class="p-4 m-auto w-fit bg-red-900/50 rounded-md text-center"
  >
    {{ error }}
  </div>

  <div class="flex-1 flex flex-col justify-center items-center relative">
    <!-- Navigation Overlay -->
    <div class="absolute inset-0 flex">
      <RouterLink
        v-if="backRoute"
        :to="backRoute"
        class="absolute inset-0 w-full h-full cursor-zoom-out"
      />
      <RouterLink
        v-if="prevRoute"
        :to="prevRoute"
        replace
        class="absolute left-0 w-1/4 h-full hover:bg-gray-500/20 transition duration-150 cursor-w-resize"
      />
      <RouterLink
        v-if="nextRoute"
        :to="nextRoute"
        replace
        class="absolute right-0 w-1/4 h-full hover:bg-gray-500/20 transition duration-150 cursor-e-resize"
      />
    </div>

    <div
      v-if="permission.adminView"
      class="border-2 rounded-xl p-4 m-4 flex flex-col gap-1 text-center relative z-10 bg-black/50"
    >
      <div class="flex gap-2 m-auto">
        <button class="button is-danger" @click="deletePhoto(item.id)">
          Delete
        </button>
        <button class="button is-success" :disabled="!changed" @click="save">
          Save
        </button>
      </div>

      <div class="field">
        <label class="label">Description</label>
        <input
          v-model="inputs.description"
          class="input is-primary w-80 m-auto"
          type="text"
          @keyup.enter="save"
        />
      </div>

      <div class="field">
        <label class="label">Collection</label>
        <select
          v-model="inputs.collection"
          class="select input is-primary w-80 m-auto"
        >
          <option :value="0">(No Collection)</option>
          <option v-for="c of possibleCollections" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="label">Tags</label>
        <div class="flex flex-row flex-wrap gap-1 justify-center items-center">
          <span
            v-for="tag of tags"
            :key="tag.id"
            class="rounded-sm p-2 m-2 border-2 border-transparent hover:border-white transition"
            @click="updateTag(tag.id, !tag.selected)"
          >
            {{ tag.name }} {{ tag.selected ? '✓' : '' }}
          </span>
        </div>
      </div>

      <div class="field has-addons m-auto">
        <div class="control">
          <input
            v-model="newCollectionOrTag"
            class="input is-primary"
            type="text"
            placeholder="Name"
          />
        </div>
        <div class="control">
          <button
            class="button is-primary"
            :disabled="!newCollectionOrTag"
            @click="createNew('collection')"
          >
            collection
          </button>
        </div>
        <div class="control">
          <button
            class="button is-primary"
            :disabled="!newCollectionOrTag"
            @click="createNew('tag')"
          >
            tag
          </button>
        </div>
      </div>
    </div>

    <div v-if="item" class="pointer-events-none w-full p-2">
      <CapturedImage :image="item" :size="0" />
    </div>

    <div class="relative z-10">
      {{ item.description }}
    </div>
  </div>
</template>
