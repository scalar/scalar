import type { WorkspaceStore } from '@scalar/workspace-store/client'

import type { AppState } from './features/app/app-state'

declare global {
  interface Window {
    dataDumpWorkspace: () => WorkspaceStore | null
    dumpAppState: () => AppState
  }
}
