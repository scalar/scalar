import type { Server, ServerState } from '../types'

export function getUrlFromServerState({
  state,
  servers,
}: {
  state: ServerState
  servers: Server[]
}) {
  if (state.selectedServer === null) {
    // TODO: Just pick the first server then?
    return servers[0].url ?? ''
  }

  const url = servers[state.selectedServer].url

  // TODO: Replace variables

  return url
}
