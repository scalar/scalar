import { reactive } from 'vue'

import type { AuthenticationState, ServerState } from '../types'

export const createEmptyAuthenticationState = (): AuthenticationState => ({
  securitySchemeKey: null,
  http: {
    basic: {
      username: '',
      password: '',
    },
    bearer: {
      token: '',
    },
  },
  apiKey: {
    token: '',
  },
})

const authentication = reactive<AuthenticationState>(
  createEmptyAuthenticationState(),
)

const setAuthentication = (newState: Partial<AuthenticationState>) => {
  Object.assign(authentication, {
    ...authentication,
    ...newState,
  })
}

export const createEmptyServerState = (): ServerState => ({
  selectedServer: null,
  variables: [],
})

const server = reactive<ServerState>(createEmptyServerState())

const setServer = (newState: Partial<ServerState>) => {
  Object.assign(server, {
    ...server,
    ...newState,
  })
}

export const useGlobalStore = () => ({
  authentication,
  setAuthentication,
  server,
  setServer,
})
