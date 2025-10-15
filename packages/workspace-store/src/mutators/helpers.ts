import type { WorkspaceStore } from '@/client'
import type { AsyncApiDocument } from '@/schemas/v3.0/asyncapi-document'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

export const getDocument = (
  store: WorkspaceStore,
  documentName: string,
): OpenApiDocument | AsyncApiDocument | undefined => {
  const document = store.workspace.documents[documentName]

  if (!document) {
    return undefined
  }

  return document
}
