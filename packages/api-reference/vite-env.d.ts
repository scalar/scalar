/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_NEW_API_CLIENT: boolean
}

type ImportMeta = {
  readonly env: ImportMetaEnv
}
