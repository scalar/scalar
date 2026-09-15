import { describe, expect, it } from 'vitest'

import { oauth2MetadataToFlows } from './oauth2-metadata-to-flows'

describe('oauth2-metadata-to-flows', () => {
  const metadata = {
    authorization_endpoint: 'https://example.com/authorize',
    token_endpoint: 'https://example.com/token',
    scopes_supported: ['read'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
  }

  it('discovers supported grants when the declared flows are empty', () => {
    expect(oauth2MetadataToFlows(metadata, {})).toStrictEqual({
      authorizationCode: {
        authorizationUrl: metadata.authorization_endpoint,
        tokenUrl: metadata.token_endpoint,
        scopes: { read: '' },
      },
      clientCredentials: { tokenUrl: metadata.token_endpoint, scopes: { read: '' } },
    })
  })

  it('fills missing endpoints without overwriting explicit configuration or adding grants', () => {
    expect(
      oauth2MetadataToFlows(metadata, {
        authorizationCode: {
          authorizationUrl: 'https://explicit.example.com/authorize',
          tokenUrl: '',
          refreshUrl: '',
          scopes: { write: 'Write access' },
          'x-usePkce': 'SHA-256',
        },
      }),
    ).toStrictEqual({ authorizationCode: { tokenUrl: metadata.token_endpoint } })
  })

  it('leaves explicit endpoints and empty scopes unchanged', () => {
    expect(
      oauth2MetadataToFlows(metadata, {
        clientCredentials: { tokenUrl: 'https://explicit.example.com/token', refreshUrl: '', scopes: {} },
      }),
    ).toStrictEqual({})
  })

  it('uses the RFC8414 default grants when grant types are omitted', () => {
    expect(oauth2MetadataToFlows({ authorization_endpoint: metadata.authorization_endpoint }, {})).toStrictEqual({
      implicit: { authorizationUrl: metadata.authorization_endpoint, scopes: {} },
    })
  })
})
