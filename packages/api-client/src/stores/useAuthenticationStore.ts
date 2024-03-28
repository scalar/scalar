import { type AuthenticationState } from '@scalar/oas-utils'
import { ssrState } from '@scalar/oas-utils'
import { reactive } from 'vue'

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
  ssrState['useGlobalStore-authentication'] ?? createEmptyAuthenticationState(),
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
