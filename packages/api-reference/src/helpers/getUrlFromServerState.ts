import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

export function getUrlFromServerState(state: ServerState) {
  let url =
    state.selectedServer === null
      ? state?.servers?.[0]?.url ?? undefined
      : state?.servers?.[state.selectedServer]?.url

  if (url?.startsWith('/') && !window.location.origin.endsWith("/")) {
    url = `${window.location.origin}${url.slice(1)}`
  }

  return url ? replaceVariables(url, state?.variables) : undefined
}
