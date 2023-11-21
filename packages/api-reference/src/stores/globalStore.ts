import { computed, reactive } from 'vue'

import { deepMerge } from '../helpers'
import {
  type AuthenticationState,
  DEFAULT_CONFIG,
  type ReferenceConfiguration,
  type ServerState,
} from '../types'

/** Configuration */
const currentConfiguration: ReferenceConfiguration = reactive({})

const setConfiguration = (newConfiguration: ReferenceConfiguration) => {
  Object.assign(currentConfiguration, newConfiguration)
}

// Merge the default configuration with the given configuration.
const configuration = computed(
  (): ReferenceConfiguration =>
    deepMerge(currentConfiguration ?? {}, { ...DEFAULT_CONFIG }),
)

/** Authentcation */
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
  setConfiguration,
  configuration,
  authentication,
  setAuthentication,
  server,
  setServer,
})
