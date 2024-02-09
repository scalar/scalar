import type { ServerState } from '@scalar/api-client'

import { replaceVariables } from './replaceVariables'

export function getUrlFromServerState(state: ServerState) {
  let url =
    state.selectedServer === null
      ? state?.servers?.[0]?.url ?? undefined
      : state?.servers?.[state.selectedServer]?.url

  if (url?.startsWith('/')) {
    // Remove trailing slash from window.location.origin
    const origin = window.location.origin.endsWith('/')
      ? window.location.origin.slice(0, -1)
      : window.location.origin

    // Prefix the URL with the window.location.origin
    url = `${origin}${url}`
  }

  return url ? replaceVariables(url, state?.variables) : undefined
}
