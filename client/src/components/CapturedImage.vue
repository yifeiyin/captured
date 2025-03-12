<script setup lang="ts">
import { usePermissionStore } from '@/helper/stores';
import Blurhash from './Blurhash.vue'
import { ref, useTemplateRef, watch } from 'vue';
import { useElementSize, useIntervalFn } from '@vueuse/core';

const props = defineProps<{
  size: number,
  image: {
    id: number,
    description: string,
    width: number,
    height: number,
    blurhash: string,
    resources: {
      type: string,
      size: number,
      width: number,
      height: number,
      fileId: string
    }[],
  }
}>()

const permissionStore = usePermissionStore()

const fileIdToUrl = (fileId: string) => `${import.meta.env.VITE_IMAGE_BUCKET_BASE_URL}/${fileId}`

const srcset = props.image.resources.map(r => `${fileIdToUrl(r.fileId)} ${r.width}w`).join(', ')

const imgRef = useTemplateRef<HTMLImageElement>('imgRef')
const srcBeingUsed = ref<string>('')

const { width, height } = useElementSize(imgRef);

const { pause, resume } = useIntervalFn(() => {
  srcBeingUsed.value = imgRef.value?.currentSrc ?? '';
}, 10);

watch(() => permissionStore.adminView, (isAdmin) => {
  if (isAdmin) {
    resume();
  } else {
    pause();
  }
}, { immediate: true });
</script>


<template>
  <div class="relative" v-view-transition-name="'img' + image.id">

    <Blurhash class="w-full h-full absolute inset-0 z-[-1]" :width="image.width" :height="image.height" :blurhashString="image.blurhash" />

    <picture>
      <source type="image/webp" :srcset="srcset" :sizes="size ? size + 'vw' : '100vw'" />
      <img loading="lazy" ref="imgRef" :class="[{ 'max-w-screen max-h-[80vh] w-auto h-auto': size === 0 }]" :width="image.width" :height="image.height" :src="fileIdToUrl(image.resources?.[0]?.fileId)" :alt="image.description" />
    </picture>

    <div v-view-transition-name="'txt' + image.id" v-if="permissionStore.adminView" class="absolute top-1 left-1 flex flex-col justify-start p-2 border bg-black/50 text-white">
      <span>#{{ image.id }}: {{ image.description }}</span>
      <span>{{ width }}x{{ height }}</span>
      <span v-for="r of image.resources" :key="r.fileId">
        <span>
          {{ r.type }}, {{ r.width }}x{{ r.height }}, {{ ~~(r.size / 1024) }}kb
          <template v-if="fileIdToUrl(r.fileId) === srcBeingUsed">(current)</template>
        </span>
      </span>
    </div>
  </div>
</template>
