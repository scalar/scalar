import { reactive } from 'vue'

import type { AuthenticationState } from '../types'

export const createEmptyAuthenticationState = (): AuthenticationState => ({
  securitySchemeKey: null,
  type: 'none',
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

const authentication = reactive(createEmptyAuthenticationState())

const setAuthentication = (newState: Partial<AuthenticationState>) => {
  Object.assign(authentication, {
    ...authentication,
    ...newState,
  })
}

export const useGlobalStore = () => ({
  authentication,
  setAuthentication,
})
