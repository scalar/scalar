import type { WorkspaceDocument } from '@/schemas'

/**
 * Toggle use document security
 */
export const toggleDocumentSecurity = (document: WorkspaceDocument | null) => {
  if (!document) {
    return
  }

  document['x-scalar-document-security'] = !document['x-scalar-document-security']
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
