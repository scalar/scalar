import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(state: ServerState) {
  let url =
    state.selectedServer === null
      ? state?.servers?.[0]?.url ?? undefined
      : state?.servers?.[state.selectedServer]?.url

  // Path `/v1`
  if (url?.startsWith('/')) {
    url = `${normalizedWindowOrigin()}${url}`
  }
  // Path `v1`
  else if (url && !url?.startsWith('http://') && !url?.startsWith('https://')) {
    url = `${normalizedWindowOrigin()}/${url}`
  }

  return url ? replaceVariables(url, state?.variables) : undefined
}

/**
 * Removes trailing slashes from window.location.origin
 */
const normalizedWindowOrigin = () => {
  const location = window.location.origin

  return location.endsWith('/') ? location.slice(0, -1) : location
}
