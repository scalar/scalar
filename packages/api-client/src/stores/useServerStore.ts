import { reactive } from 'vue'

import type { ServerState } from '../types'

export const createEmptyServerState = (): ServerState => ({
  selectedServer: null,
  servers: [],
  variables: [],
})

const server = reactive<ServerState>(createEmptyServerState())

const setServer = (newState: Partial<ServerState>) => {
  Object.assign(server, {
    ...server,
    ...newState,
  })
}

export const useServerStore = () => ({
  server,
  setServer,
})
