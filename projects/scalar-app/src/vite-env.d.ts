import type { WorkspaceStore } from '@scalar/workspace-store/client'

import type { useAppState } from './features/app/app-state'

declare global {
  interface Window {
    dataDumpWorkspace: () => WorkspaceStore | null
    dumpAppState: typeof useAppState
  }
}
