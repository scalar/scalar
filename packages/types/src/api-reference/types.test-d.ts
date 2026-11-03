import { assertType, describe, it } from 'vitest'

import type { ApiReferenceConfiguration, AuthenticationConfiguration } from './types'

describe('types', () => {
  describe('AuthenticationConfiguration', () => {
    it('accepts x-order and x-scalar-ignore on OAuth2 flows', () => {
      assertType<AuthenticationConfiguration>({
        securitySchemes: {
          oAuth2: {
            flows: {
              implicit: { 'x-order': 1 },
              clientCredentials: { 'x-order': 2 },
              password: { 'x-scalar-ignore': true },
            },
          },
        },
      })
    })

    it('rejects invalid values for the flow extensions', () => {
      assertType<AuthenticationConfiguration>({
        securitySchemes: {
          oAuth2: {
            flows: {
              // @ts-expect-error x-order must be a number
              implicit: { 'x-order': 'first' },
            },
          },
        },
      })
    })
  })

  describe('ApiReferenceConfiguration', () => {
    it('accepts OAuth2 flow ordering in the authentication configuration', () => {
      assertType<Partial<ApiReferenceConfiguration>>({
        authentication: {
          securitySchemes: {
            oAuth2: {
              flows: {
                implicit: { 'x-order': 1 },
                clientCredentials: { 'x-order': 2 },
              },
            },
          },
        },
      })
    })
  })
})
