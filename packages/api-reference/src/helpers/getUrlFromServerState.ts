import type { Server, ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

export function getUrlFromServerState({
  state,
  servers,
}: {
  state: ServerState
  servers: Server[]
}) {
  const url =
    state.selectedServer === null
      ? servers[0].url ?? ''
      : servers[state.selectedServer].url

  return replaceVariables(url, state.variables)
}
