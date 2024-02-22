import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(state: ServerState) {
  // Get the selected server
  const server =
    state.selectedServer === null
      ? state?.servers?.[0]
      : state?.servers?.[state.selectedServer]

  // Replace variables: {protocol}://{host}:{port}/{basePath}
  let url =
    typeof server?.url === 'string'
      ? replaceVariables(server?.url, state.variables)
      : server?.url

  // Path `/v1`
  if (url?.startsWith('/')) {
    url = `${normalizedWindowOrigin()}${url}`
  }
  // Path `v1`
  else if (url && !url?.startsWith('http://') && !url?.startsWith('https://')) {
    url = `${normalizedWindowOrigin()}/${url}`
  }

  return url
}

/**
 * Removes trailing slashes from window.location.origin
 */
const normalizedWindowOrigin = () => {
  const location = window.location.origin

  return location.endsWith('/') ? location.slice(0, -1) : location
}
