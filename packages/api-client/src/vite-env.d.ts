import type { WorkspaceStore } from '@scalar/workspace-store/client'

/** The version number taken from the package.json */
declare const PACKAGE_VERSION: string

declare global {
  interface Window {
    dataDumpWorkspace: () => WorkspaceStore | null
  }
}
