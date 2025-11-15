import type { WorkspaceDocument } from '@/schemas'

/**
 * Toggle setting selected security schemes at the operation level
 */
export const toggleSecurity = (document: WorkspaceDocument | null) => {
  if (!document) {
    return
  }

  document['x-scalar-set-operation-security'] = !document['x-scalar-set-operation-security']
}

export const updateWatchMode = (document: WorkspaceDocument | null, watchMode: boolean) => {
  if (!document) {
    return
  }

  document['x-scalar-watch-mode'] = watchMode
}
