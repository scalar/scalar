import { reactive } from 'vue'

import type { AuthenticationState } from '../types'

export const createEmptyAuthenticationState = (): AuthenticationState => ({
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

const setAuthentication = (auth: Partial<AuthenticationState>) => {
  Object.assign(authentication, {
    ...authentication,
    ...auth,
  })
}

export const useGlobalStore = () => ({
  authentication,
  setAuthentication,
})
