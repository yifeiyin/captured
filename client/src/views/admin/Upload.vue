<script setup lang="ts">
import { useDropZone } from '@vueuse/core';
import { ref } from 'vue';
import { trpc } from '../../helper/fetcher';

const dropZoneRef = ref<HTMLDivElement>();
const fileSelectRef = ref<HTMLInputElement>();

interface FileWithMetadata {
  file: File;
  metadata: {
    mtime: number;
    filename: string;
    size: number;
    type: string;
  };
}
const selectedFiles = ref<FileWithMetadata[]>([]);

function onSelectFiles(files: File[]) {
  selectedFiles.value = files
    .map((f) => ({
      file: f,
      metadata: {
        mtime: f.lastModified,
        filename: f.name,
        size: f.size,
        type: f.type,
      },
    }))
    .filter((f) => f.metadata.type.startsWith('image/'));
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files) => {
    onSelectFiles(files ?? []);
  },
  dataTypes: ['image/jpg', 'image/jpeg', 'image/png'],
  multiple: true,
  preventDefaultForUnhandled: false,
});

async function fileToBase64(f: File): Promise<string> {
  const dataURL = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(f);
  });

  return (await dataURL).split(',')[1];
}

async function submit() {
  const filesToUpload = [...selectedFiles.value];

  for (const fileWithMetadata of filesToUpload) {
    const startTime = performance.now();
    const base64File = await fileToBase64(fileWithMetadata.file);

    await trpc.photos.upload.mutate([
      {
        filename: fileWithMetadata.metadata.filename,
        size: fileWithMetadata.metadata.size,
        type: fileWithMetadata.metadata.type,
        mtime: fileWithMetadata.metadata.mtime,
        bytes: base64File,
      },
    ]);

    const endTime = performance.now();
    console.log(
      `File ${fileWithMetadata.metadata.filename} uploaded in ${((endTime - startTime) / 1000).toFixed(2)} s`
    );

    selectedFiles.value = selectedFiles.value.filter(
      (f) => f.metadata.filename !== fileWithMetadata.metadata.filename
    );
  }
}

function onSelectToUpload(payload: Event) {
  const fileList = (payload.target! as HTMLInputElement).files as FileList;
  onSelectFiles(Array.from(fileList));
}

function clear() {
  onSelectFiles([]);
}

function generateURL(file: FileWithMetadata) {
  return URL.createObjectURL(file.file);
}

function removeUpload(index: number) {
  selectedFiles.value.splice(index, 1);
}
</script>

<template>
  <div class="grid place-items-center grid-cols-2 p-20">
    <div
      ref="dropZoneRef"
      class="relative h-40 col-span-full place-self-stretch border-2 rounded-md border-dashed bg-gray-100 flex items-center justify-center cursor-pointer"
      :style="{ backgroundColor: isOverDropZone ? 'green' : '' }"
      @click="fileSelectRef?.click()"
    >
      <div v-if="selectedFiles.length">
        {{ selectedFiles.length }} file(s) selected.
      </div>
      <div v-else>Drag file to here</div>
      <input
        ref="fileSelectRef"
        type="file"
        class="hidden"
        multiple
        @change="onSelectToUpload($event)"
      />
    </div>
    <div class="col-span-full">
      <ul>
        <li
          v-for="(f, index) in selectedFiles"
          :key="index"
          class="border rounded-sm m-2 text-center"
        >
          <img
            :id="'pending-upload-file' + index"
            :src="generateURL(f)"
            :alt="f.metadata.filename"
          />
          <span>{{ f.metadata.type }}, {{ f.metadata.filename }}</span>
          <button class="button is-small" @click="removeUpload(index)">
            Remove
          </button>
        </li>
      </ul>
    </div>
    <button class="button is-success" @click="submit">Upload</button>
    <button class="button is-danger" @click="clear">Clear</button>
  </div>
</template>
