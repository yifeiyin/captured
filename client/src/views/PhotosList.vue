<script setup lang="ts">
import { computed } from 'vue';
import { trpc } from '../helper/fetcher';
import { RouterLink } from 'vue-router';
import CapturedImage from '@/components/CapturedImage.vue';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { looselyOrdered } from '@/helper/layout';
import { startViewTransition } from 'vue-view-transitions'


type Photo = Awaited<ReturnType<typeof trpc.photos.list.query>>[number];


const props = defineProps<{ collection?: string, tag?: string }>();

const photos = useStorage<Photo[]>(`photos-${JSON.stringify(props)}`, [], undefined, { serializer: StorageSerializers.object });

trpc.photos.list.query({ collectionName: props.collection === 'none' ? null : props.collection, tagName: props.tag })
  .then((res) => {
    photos.value = res;

    photos.value.forEach((p) => {
      useStorage(`photo-${p.id}`, p);
    })
  })
  .catch((err) => {
    photos.value = [];
  });

const AllowedSizes = [
  { '-': 1, '|': 1 },
  { '-': 1, '|': 2 },
  { '-': 2, '|': 3 },
  { '-': 3, '|': 4 },
  { '-': 4, '|': 5 },
  { '-': 5, '|': 7 },
  { '-': 6, '|': 8 },
  { '-': 7, '|': 9 },
  { '-': 8, '|': 10 },
]

const currentSize = useStorage('currentSize', 3);

async function onSizeChange(zoomIn: number) {
  await startViewTransition().captured;

  currentSize.value = Math.max(0, Math.min(AllowedSizes.length - 1, currentSize.value - zoomIn));
}

const config = computed(() => {
  return AllowedSizes[currentSize.value];
});

const groupedPhotos = computed(() => {
  return looselyOrdered(config.value, photos.value, (x) => x.width > x.height ? '-' : '|');
});

function imageLinkWithContext(photo: Photo) {
  return props.collection ? `/collections/${props.collection}/photos/${photo.id}` :
    props.tag ? `/tags/${props.tag}/photos/${photo.id}` :
      `/photos/${photo.id}`;
}
</script>

<template>
  <div class="flex justify-between">
    <h1 v-if="props.collection" class="text-2xl font-bold p-4">Collection: <span v-view-transition-name="'collection' + props.collection">{{ props.collection }}</span></h1>
    <h1 v-else-if="props.tag" class="text-2xl font-bold p-4">Tag: <span v-view-transition-name="'tag' + props.tag">{{ props.tag }}</span></h1>
    <h1 v-else class="text-2xl font-bold p-4">All Photos</h1>
    <div class="field has-addons px-4">
      <p class="control">
        <button class="button" @click="onSizeChange(-1)" :disabled="currentSize === AllowedSizes.length - 1">–</button>
      </p>
      <p class="control">
        <button class="button" @click="onSizeChange(currentSize - 3)" :disabled="currentSize === 3" title="Reset to default">⌾</button>
      </p>
      <p class="control">
        <button class="button" @click="onSizeChange(+1)" :disabled="currentSize === 0">+</button>
      </p>
    </div>
  </div>
  <div class="flex flex-col gap-0.5">
    <div v-for="group in groupedPhotos" :key="group.items.map(x => x.id).join(',')" class="flex flex-row items-center justify-center gap-0.5">
      <div v-for="item of group.items" :key="item.id" :style="{ width: `${100 / config[group.type]}%` }">
        <RouterLink :to="imageLinkWithContext(item)">
          <CapturedImage :key="item.id" :image="item" :size="100 / config[group.type]" />
        </RouterLink>
      </div>
    </div>
  </div>

</template>
