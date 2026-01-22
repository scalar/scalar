import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'

/**
 * Get the selected server for a document,
 * we can later expand this to support operation/path servers as well
 *
 * If x-scalar-selected-server is undefined we select the first server (this means the user has not selected a server yet)
 * If the user has un-selected a server it would be an empty string
 */
export const getSelectedServer = (document: WorkspaceDocument | null, servers: ServerObject[] | null) => {
  // Select the first server if the user has not selected a server yet
  if (typeof document?.['x-scalar-selected-server'] === 'undefined' && servers?.length) {
    return servers[0]!
  }

  // Return the server matching the x-scalar-selected-server URL
  return servers?.find(({ url }) => url === document?.['x-scalar-selected-server']) ?? null
}
