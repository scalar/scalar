import { reactive } from 'vue'

import type { AuthenticationState, ServerState } from '../types'
import { ssrState } from './ssrState'

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
  oAuth2: {
    clientId: '',
    scopes: [],
    accessToken: '',
    state: '',
  },
})

// Grab server state and preload if we have it
const ssrStateKey = 'useGlobalStore-authentication'
const authentication = reactive<AuthenticationState>(
  ssrState[ssrStateKey] ?? createEmptyAuthenticationState(),
)

const setAuthentication = (newState: Partial<AuthenticationState>) => {
  Object.assign(authentication, {
    ...authentication,
    ...newState,
  })
}

/** Server */
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

export const useGlobalStore = () => ({
  authentication,
  setAuthentication,
  server,
  setServer,
  ssrStateKey,
})
