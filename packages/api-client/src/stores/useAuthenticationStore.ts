import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { reactive } from 'vue'

export type AuthenticationState = {
  preferredSecurityScheme: string | null
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
    accessToken: string
    state: string
  }
}

export const createEmptyAuthenticationState = (): AuthenticationState => ({
  preferredSecurityScheme: null,
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

const authentication = reactive<AuthenticationState>(
  createEmptyAuthenticationState(),
)

const setAuthentication = (newState: Partial<AuthenticationState>) => {
  Object.assign(authentication, {
    ...authentication,
    ...newState,
  })
}

export const useAuthenticationStore = () => ({
  authentication,
  setAuthentication,
})
