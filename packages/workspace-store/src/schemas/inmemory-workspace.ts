import type { DocumentAuth } from '@/entities/auth/schema'
import type { DocumentHistory } from '@/entities/history/schema'
import type { RequestBodyBaselines } from '@/helpers/snapshot-request-bodies'
import type { WorkspaceDocument, WorkspaceExtensions, WorkspaceMeta } from '@/schemas/workspace'

export type InMemoryWorkspace = {
  meta: WorkspaceMeta & WorkspaceExtensions
  documents: Record<string, WorkspaceDocument>
  originalDocuments: Record<string, Record<string, unknown>>
  intermediateDocuments: Record<string, Record<string, unknown>>
  overrides: Record<string, any>
  /** Optional for compatibility with workspace exports created before body reset was available. */
  requestBodyBaselines?: Record<string, RequestBodyBaselines>
  history: DocumentHistory
  auth: DocumentAuth
}
