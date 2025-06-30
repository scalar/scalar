import type { WorkspaceStore } from '@/client'

export const getDocument = (store: WorkspaceStore, documentName: string) => {
  const document = store.workspace.documents[documentName]

  if (!document) {
    return
  }

  return document
}
