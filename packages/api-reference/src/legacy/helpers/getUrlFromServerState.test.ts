import { describe, expect, it } from 'vitest'

import { createEmptyServerState } from '../stores'
import { getUrlFromServerState } from './getUrlFromServerState'

describe('getUrlFromServerState', () => {
  it('returns both original and modified URLs without variables', () => {
    const { originalUrl, modifiedUrl } = getUrlFromServerState({
      ...createEmptyServerState(),
      servers: [
        {
          url: 'https://example.com',
        },
      ],
      selectedServer: 0,
    })

    expect(originalUrl).toBe('https://example.com')
    expect(modifiedUrl).toBe('https://example.com')
  })

  it('replaces variables in the modified URL', () => {
    const { originalUrl, modifiedUrl } = getUrlFromServerState({
      ...createEmptyServerState(),
      selectedServer: 0,
      servers: [
        {
          url: 'https://{example_variable}.fantasy',
        },
      ],
      variables: {
        example_variable: 'unicorn',
      },
    })

    expect(originalUrl).toBe('https://{example_variable}.fantasy')
    expect(modifiedUrl).toBe('https://unicorn.fantasy')
  })

  it('replaces variables and maintains original URL', () => {
    const { originalUrl, modifiedUrl } = getUrlFromServerState({
      ...createEmptyServerState(),
      variables: {
        protocol: 'https',
        managementAPIHost: 'localhost:8083',
      },
      selectedServer: 0,
      servers: [
        {
          url: '{protocol}://{managementAPIHost}/management/v2',
          description: 'APIM Management API v2 - Default base URL',
          variables: {
            protocol: {
              description:
                'The protocol you want to use to communicate with the mAPI',
              default: 'https',
              enum: ['https', 'http'],
            },
            managementAPIHost: {
              description:
                'The domain of the server hosting your Management API',
              default: 'localhost:8083',
            },
          },
        },
      ],
    })

    expect(originalUrl).toBe('{protocol}://{managementAPIHost}/management/v2')
    expect(modifiedUrl).toBe('https://localhost:8083/management/v2')
  })
})
