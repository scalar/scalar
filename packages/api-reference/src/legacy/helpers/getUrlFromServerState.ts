import type { ServerState } from '#legacy'
import { replaceVariables } from '@scalar/oas-utils/helpers'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(state: ServerState) {
  // Get the selected server and remove trailing slash
  const server = state?.servers?.[state.selectedServer ?? 0]

  if (server?.url?.endsWith('/')) {
    server.url = server.url.slice(0, -1)
  }

  // Replace variables: {protocol}://{host}:{port}/{basePath}
  const url =
    typeof server?.url === 'string'
      ? replaceVariables(server?.url, state.variables)
      : server?.url

  return url
}
