/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_ENV_ID: string
  readonly VITE_CLOUD_APPID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'vue3-emoji-picker'
declare module 'vue3-emoji-picker/css'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
