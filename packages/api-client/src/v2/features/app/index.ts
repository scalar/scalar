export { type AppState, useAppState } from '@/v2/features/app/app-state'
export type { ClientPlugin } from '@/v2/helpers/plugins'
export type { ClientLayout } from '@/v2/types/layout'

export type {
  baseClientActions,
  baseRoutes,
  useCommandPaletteState,
} from '../command-palette/hooks/use-command-palette-state'
export { default as ClientApp } from './App.vue'
export { createApiClientApp, createAppRouter } from './helpers/create-api-client-app'
