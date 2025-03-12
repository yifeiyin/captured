/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string,
  readonly VITE_IMAGE_BUCKET_BASE_URL: string,
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
