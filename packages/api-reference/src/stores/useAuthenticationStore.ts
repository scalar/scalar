import { reactive } from 'vue'

import type { AuthenticationState } from '../types'

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
