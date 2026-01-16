import type { WorkspaceStore } from '@scalar/workspace-store/client'

import type { useAppState } from './v2/features/app/app-state'

declare global {
  /** The version number taken from the package.json */
  const PACKAGE_VERSION: string

  interface Window {
    dataDumpWorkspace: () => WorkspaceStore | null
    dumpAppState: typeof useAppState
  }
}
