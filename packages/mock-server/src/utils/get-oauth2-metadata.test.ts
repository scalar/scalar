import { describe, expect, it } from 'vitest'

import { getOAuth2Metadata } from './get-oauth2-metadata'

describe('get-oauth2-metadata', () => {
  it('advertises local endpoints and deduplicates scopes across supported flows', () => {
    expect(
      getOAuth2Metadata(
        {
          authorizationCode: {
            authorizationUrl: 'https://real.example.com/authorize',
            tokenUrl: 'https://real.example.com/token',
            scopes: { read: 'Read' },
          },
          implicit: { authorizationUrl: '/authorize', scopes: { read: 'Read', write: 'Write' } },
          clientCredentials: { tokenUrl: '/token', scopes: {} },
          password: { tokenUrl: '/token', scopes: {} },
        },
        'https://mock.example.com',
      ),
    ).toStrictEqual({
      issuer: 'https://mock.example.com',
      authorization_endpoint: 'https://mock.example.com/authorize',
      token_endpoint: 'https://mock.example.com/token',
      response_types_supported: ['code', 'token'],
      grant_types_supported: ['authorization_code', 'implicit', 'client_credentials', 'password'],
      scopes_supported: ['read', 'write'],
    })
  })

  it('omits the authorization endpoint for client credentials', () => {
    expect(
      getOAuth2Metadata({ clientCredentials: { tokenUrl: '/token', scopes: {} } }, 'http://localhost:3000'),
    ).toStrictEqual({
      issuer: 'http://localhost:3000',
      token_endpoint: 'http://localhost:3000/token',
      response_types_supported: [],
      grant_types_supported: ['client_credentials'],
      scopes_supported: [],
    })
  })

  it('does not invent grants for an empty flows object', () => {
    expect(getOAuth2Metadata({}, 'https://mock.example.com')).toStrictEqual({
      issuer: 'https://mock.example.com',
      response_types_supported: [],
      grant_types_supported: [],
      scopes_supported: [],
    })
  })
})
