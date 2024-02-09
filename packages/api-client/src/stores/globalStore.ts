import { type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'
import { reactive } from 'vue'

// TODO: apiClientStore, globalStore, requestStore … Let’s tidy this up asap.

/** Server */
export type Server = {
  url: string
  description?: string
  variables?: ServerVariables
}

export type ServerVariables = Record<
  string,
  {
    default?: string | number
    description?: string
    enum?: (string | number)[]
  }
>

// TODO: Wait … shouldn’t we just use the ServerVariable above?
export type Variable = {
  [key: string]: string
}

export type ServerState = {
  selectedServer: null | number
  description?: string
  servers: Server[]
  variables: Variable[]
}

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

/** Authentication */
export type AuthenticationState = {
  securitySchemeKey: string | null
  securitySchemes?:
    | OpenAPIV3.ComponentsObject['securitySchemes']
    | OpenAPIV3_1.ComponentsObject['securitySchemes']
  http: {
    basic: {
      username: string
      password: string
    }
    bearer: {
      token: string
    }
  }
  apiKey: {
    token: string
  }
  oAuth2: {
    clientId: string
    scopes: string[]
  }
}

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

export const useGlobalStore = () => ({
  authentication,
  setAuthentication,
  server,
  setServer,
})
