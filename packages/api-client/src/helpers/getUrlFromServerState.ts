import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(state: ServerState) {
  // Get the selected server
  const server = state?.servers?.[state.selectedServer ?? 0]

  // Replace variables: {protocol}://{host}:{port}/{basePath}
  const url =
    typeof server?.url === 'string'
      ? replaceVariables(server?.url, state.variables)
      : server?.url

  return url
}
