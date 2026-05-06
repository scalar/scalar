export type { ClientLayout } from '@scalar/api-client/types'

export type { RegistryAdapter, RegistryDocumentsState } from '@/types/configuration'
export { type AppState, createAppState } from '@/features/app/app-state'
export { default as CreateWorkspaceModal } from '@/features/app/components/CreateWorkspaceModal.vue'
export { default as CommandActionForm } from '@/features/command-palette/components/CommandActionForm.vue'
export { default as CommandActionInput } from '@/features/command-palette/components/CommandActionInput.vue'

export {
  type CommandPaletteAction,
  type CommandPaletteRoute,
  baseClientActions,
  baseRoutes,
  useCommandPaletteState,
} from '../command-palette/hooks/use-command-palette-state'
export { default as ClientApp } from './App.vue'
export { createApiClientApp, createAppRouter } from './helpers/create-api-client-app'
