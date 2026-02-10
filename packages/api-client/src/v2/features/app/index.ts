export { type AppState, createAppState } from '@/v2/features/app/app-state'
export { default as CreateWorkspaceModal } from '@/v2/features/app/components/CreateWorkspaceModal.vue'
export { default as CommandActionForm } from '@/v2/features/command-palette/components/CommandActionForm.vue'
export { default as CommandActionInput } from '@/v2/features/command-palette/components/CommandActionInput.vue'
export type { ClientPlugin } from '@/v2/helpers/plugins'
export type { ClientLayout } from '@/v2/types/layout'

export {
  type CommandPaletteAction,
  type CommandPaletteRoute,
  baseClientActions,
  baseRoutes,
  useCommandPaletteState,
} from '../command-palette/hooks/use-command-palette-state'
export { default as ClientApp } from './App.vue'
export { createApiClientApp, createAppRouter } from './helpers/create-api-client-app'
