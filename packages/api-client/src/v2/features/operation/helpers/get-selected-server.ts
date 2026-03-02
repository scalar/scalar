import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Get the selected server from a list of servers and an optional selected-server URL.
 * Works for both document-level and operation-level servers: the caller passes the
 * appropriate selected URL (from document or operation).
 *
 * - If selectedServerUrl is undefined and servers has items, returns the first server
 *   (user has not selected yet).
 * - If selectedServerUrl is '' (user un-selected), returns null.
 * - Otherwise returns the server whose url matches selectedServerUrl, or null.
 */
export const getSelectedServer = (
  servers: ServerObject[] | null,
  selectedServerUrl: string | undefined,
): ServerObject | null => {
  if (!servers?.length) {
    return null
  }

  if (selectedServerUrl === undefined) {
    return servers[0]!
  }

  if (selectedServerUrl === '') {
    return null
  }

  return servers.find(({ url }) => url === selectedServerUrl) ?? null
}
