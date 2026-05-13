import type { DocumentAuth } from '@/entities/auth/schema'
import type { DocumentHistory } from '@/entities/history/schema'
import type { WorkspaceDocument, WorkspaceExtensions, WorkspaceMeta } from '@/schemas/workspace'

export type InMemoryWorkspace = {
  meta: WorkspaceMeta & WorkspaceExtensions
  documents: Record<string, WorkspaceDocument>
  originalDocuments: Record<string, Record<string, unknown>>
  intermediateDocuments: Record<string, Record<string, unknown>>
  overrides: Record<string, any>
  history: DocumentHistory
  auth: DocumentAuth
}
