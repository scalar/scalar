import { assertType, describe, it } from 'vitest'
import type { AuthenticationConfiguration } from './authentication-configuration'

describe('ApiReferenceConfiguration', () => {
  it('ensure we are generating correct types for preferredSecurityScheme', () => {
    assertType<AuthenticationConfiguration>({ preferredSecurityScheme: 'apiKey' })
    assertType<AuthenticationConfiguration>({ preferredSecurityScheme: ['apiKey', 'bearerAuth'] })
    assertType<AuthenticationConfiguration>({
      preferredSecurityScheme: ['apiKey', ['basic', 'oauth2'], ['apiKey', 'bearerAuth', 'oauth2']],
    })
    assertType<AuthenticationConfiguration>({
      // @ts-expect-error incorrect type
      preferredSecurityScheme: 47,
    })
    assertType<AuthenticationConfiguration>({
      // @ts-expect-error incorrect type
      preferredSecurityScheme: [22, null],
    })
  })

  it('ensure we are generating correct types for securitySchemes', () => {
    assertType<AuthenticationConfiguration>({
      securitySchemes: {
        apiKey: { type: 'apiKey', name: 'api_key', in: 'header' },
      },
    })
    assertType<AuthenticationConfiguration>({
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    })
    assertType<AuthenticationConfiguration>({
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            implicit: { scopes: { 'read:items': 'Read access to items' } },
            password: {
              username: 'username',
              password: 'password',
            },
          },
        },
      },
    })
  })
})
