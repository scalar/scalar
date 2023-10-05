import type { ClientRequestConfig } from '../types'

/**
 * Generate a new placeholder request
 */
export const createPlaceholderRequest = (): ClientRequestConfig => ({
  name: '',
  url: '',
  type: 'GET',
  path: '',
  parameters: [],
  headers: [],
  query: [],
  body: '',
  formData: [],
  authentication: {
    type: 'none',
    basic: {
      username: '',
      password: '',
      active: true,
    },
    oauthTwo: {
      generatedToken: '',
      discoveryURL: '',
      authURL: '',
      accessTokenURL: '',
      clientID: '',
      clientSecret: '',
      scope: '',
      active: true,
    },
    bearer: {
      token: '',
      active: true,
    },
    digest: {
      username: '',
      password: '',
      active: true,
    },
  },
})
