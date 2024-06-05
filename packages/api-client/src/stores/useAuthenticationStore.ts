import { type AuthenticationState, ssrState } from '@scalar/oas-utils'
import { reactive } from 'vue'

export const createEmptyAuthenticationState = (): AuthenticationState => ({
  preferredSecurityScheme: null,
  // In case the spec has no security and the user would like to add some
  customSecurity: false,
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
    username: '',
    password: '',
    clientId: '',
    scopes: [],
    accessToken: '',
    state: '',
    clientSecret: '',
  },
})

const authentication = reactive<AuthenticationState>(
  ssrState['useGlobalStore-authentication'] ?? createEmptyAuthenticationState(),
)

const setAuthentication = (newState: Partial<AuthenticationState>) =>
  Object.assign(authentication, newState)

export const useAuthenticationStore = () => ({
  authentication,
  setAuthentication,
})
