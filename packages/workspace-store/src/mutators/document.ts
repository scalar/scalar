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

export const updateWatchMode = (document: WorkspaceDocument | null, watchMode: boolean) => {
  if (!document) {
    return
  }

  document['x-scalar-watch-mode'] = watchMode
}
