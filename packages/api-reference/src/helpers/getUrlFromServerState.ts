import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

export function getUrlFromServerState(state: ServerState) {
  let url =
    state.selectedServer === null
      ? state?.servers?.[0]?.url ?? undefined
      : state?.servers?.[state.selectedServer]?.url

  if (url === '/') {
    url = window.location.origin
  } else if (url === '//') {
    url = window.location.origin
  }

  return url ? replaceVariables(url, state?.variables) : undefined
}
