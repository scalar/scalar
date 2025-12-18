import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'

/**
 * Get the selected server for a document,
 * we can later expand this to support operation/path servers as well
 */
export const getSelectedServer = (document: WorkspaceDocument | null) =>
  document?.servers?.find(({ url }) => url === document?.['x-scalar-selected-server']) ?? null
