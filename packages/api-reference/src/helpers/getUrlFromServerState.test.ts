import { describe, expect, it } from 'vitest'

import { createEmptyServerState } from '../stores/useServerStore'
import { getUrlFromServerState } from './getUrlFromServerState'

describe('getUrlFromServerState', () => {
  it('gets an URL', () => {
    const request = getUrlFromServerState({
      ...createEmptyServerState(),
      servers: [
        {
          url: 'https://example.com',
        },
      ],
      selectedServer: 0,
    })

    expect(request).toMatchObject('https://example.com')
  })

  it('replaces variables', () => {
    const request = getUrlFromServerState({
      ...createEmptyServerState(),
      selectedServer: 0,
      servers: [
        {
          url: 'https://{example_variable}.fantasy',
        },
      ],
      variables: [
        {
          name: 'example_variable',
          value: 'unicorn',
        },
      ],
    })

    expect(request).toMatchObject('https://unicorn.fantasy')
  })

  it('replaces variables first, and then checks whether a prefix is necessary', () => {
    const request = getUrlFromServerState({
      ...createEmptyServerState(),
      variables: [
        {
          name: 'protocol',
          value: 'https',
        },
        {
          name: 'managementAPIHost',
          value: 'localhost:8083',
        },
      ],
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

    expect(request).toMatchObject('https://localhost:8083/management/v2')
  })
})
