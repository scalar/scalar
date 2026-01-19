import type { WorkspaceStore } from '@/client'
import type { WorkspaceDocument } from '@/schemas'

export const getDocument = (store: WorkspaceStore | null, documentName: string): WorkspaceDocument | null => {
  if (!store) {
    return null
  }

  const document = store.workspace.documents[documentName]

  if (!document) {
    return null
  }

  return document
}
