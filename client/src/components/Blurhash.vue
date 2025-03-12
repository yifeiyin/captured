<template>
  <img :class="props.class" ref="imgRef" :style="imgStyle" alt="" :width="width" :height="height" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { decode, isBlurhashValid } from 'blurhash';

const props = defineProps({
  blurhashString: {
    type: String,
    required: true,
  },
  imgStyle: {
    type: Object,
    default: () => ({}),
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  class: {
    type: String,
    default: '',
  }
});

const imgRef = ref<HTMLImageElement>();

onMounted(() => {
  watch(() => props.blurhashString, (newVal) => {
    const width = Math.round(props.width / 100);
    const height = Math.round(props.height / 100);
    if (newVal) {
      if (!width || !height || !isBlurhashValid(newVal)) {
        console.warn('Invalid blurhash/width/height');
        return;
      }
      const pixels = decode(newVal, width, height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imageData = ctx!.createImageData(width, height);
      imageData.data.set(pixels);
      ctx!.putImageData(imageData, 0, 0);
      if (imgRef.value)
        imgRef.value.src = canvas.toDataURL();
    } else {
      if (imgRef.value)
        imgRef.value.src = '';
    }
  }, { immediate: true });
});
</script>
