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

/**
 * Update the document icon and also update the corresponding sidebar entry
 *
 * Does not perform a sidebar rebuild for performance benefit
 */
export const updateDocumentIcon = (document: WorkspaceDocument | null, icon: string) => {
  if (!document || !document['x-scalar-navigation']) {
    return
  }

  // Update the document icon
  document['x-scalar-icon'] = icon
  // Update the sidebar document icon
  document['x-scalar-navigation'].icon = icon
}
