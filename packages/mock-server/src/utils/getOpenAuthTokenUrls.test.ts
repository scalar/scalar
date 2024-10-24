import { describe, expect, it } from 'vitest'

import { createOpenAPIDocument } from './createOpenAPIDocument'
import { getOpenAuthTokenUrls, getPathFromUrl } from './getOpenAuthTokenUrls'

describe('getOpenAuthTokenUrls', () => {
  it('returns an empty array for schema without securitySchemes', () => {
    const schema = createOpenAPIDocument({})
    expect(getOpenAuthTokenUrls(schema)).toEqual([])
  })

  it('returns token URLs from OAuth2 password flow', () => {
    const schema = createOpenAPIDocument({
      oauth2Password: {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://api.example.com/oauth/token',
          },
        },
      },
    })
    expect(getOpenAuthTokenUrls(schema)).toEqual(['/oauth/token'])
  })

  it('returns token URLs from OAuth2 clientCredentials flow', () => {
    const schema = createOpenAPIDocument({
      oauth2ClientCredentials: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://api.example.com/oauth/client_token',
          },
        },
      },
    })
    expect(getOpenAuthTokenUrls(schema)).toEqual(['/oauth/client_token'])
  })

  it('returns token URLs from OAuth2 authorizationCode flow', () => {
    const schema = createOpenAPIDocument({
      oauth2AuthCode: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://api.example.com/oauth/authorize',
            tokenUrl: 'https://api.example.com/oauth/token',
          },
        },
      },
    })
    expect(getOpenAuthTokenUrls(schema)).toEqual(['/oauth/token'])
  })

  it('returns multiple token URLs from different OAuth2 flows', () => {
    const schema = createOpenAPIDocument({
      oauth2Password: {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://api.example.com/oauth/password_token',
          },
        },
      },
      oauth2ClientCredentials: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://api.example.com/oauth/client_token',
          },
        },
      },
    })
    expect(getOpenAuthTokenUrls(schema)).toEqual([
      '/oauth/password_token',
      '/oauth/client_token',
    ])
  })

  it('ignores non-OAuth2 security schemes', () => {
    const schema = createOpenAPIDocument({
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
      oauth2Password: {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://api.example.com/oauth/token',
          },
        },
      },
    })
    expect(getOpenAuthTokenUrls(schema)).toEqual(['/oauth/token'])
  })

  it('returns unique token URLs', () => {
    const schema = createOpenAPIDocument({
      oauth2Password: {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: 'https://api.example.com/oauth/token',
          },
        },
      },
      oauth2ClientCredentials: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://api.example.com/oauth/token',
          },
        },
      },
    })
    expect(getOpenAuthTokenUrls(schema)).toEqual(['/oauth/token'])
  })
})

describe('getPathFromUrl', () => {
  it('returns the path from a valid URL', () => {
    const url = 'https://api.example.com/oauth/token'
    expect(getPathFromUrl(url)).toBe('/oauth/token')
  })

  it('handles URLs with query parameters', () => {
    const url = 'https://api.example.com/oauth/token?param=value'
    expect(getPathFromUrl(url)).toBe('/oauth/token')
  })

  it('handles URLs with fragments', () => {
    const url = 'https://api.example.com/oauth/token#fragment'
    expect(getPathFromUrl(url)).toBe('/oauth/token')
  })

  it('handles URLs without paths', () => {
    const url = 'https://api.example.com'
    expect(getPathFromUrl(url)).toBe('/')
  })
})
