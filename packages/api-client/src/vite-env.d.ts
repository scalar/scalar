import type { WorkspaceStore } from '@scalar/workspace-store/client'

declare global {
  /** The version number taken from the package.json */
  const PACKAGE_VERSION: string

  interface Window {
    dataDumpWorkspace: () => WorkspaceStore | null
  }
}
