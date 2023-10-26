import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

export function getUrlFromServerState(state: ServerState) {
  const url =
    state.selectedServer === null
      ? state.servers[0].url ?? ''
      : state.servers[state.selectedServer].url

  return replaceVariables(url, state.variables)
}
