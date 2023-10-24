import { describe, expect, it } from 'vitest'

import { createEmptyServerState } from '../stores/globalStore'
import { getUrlFromServerState } from './getUrlFromServerState'

describe('getUrlFromServerState', () => {
  it('gets an URL', () => {
    const request = getUrlFromServerState({
      state: {
        ...createEmptyServerState(),
        selectedServer: 0,
      },
      servers: [
        {
          url: 'https://example.com',
        },
      ],
    })

    expect(request).toMatchObject('https://example.com')
  })

  it('replaces variables', () => {
    const request = getUrlFromServerState({
      state: {
        ...createEmptyServerState(),
        selectedServer: 0,
        variables: [
          {
            name: 'example_variable',
            value: 'unicorn',
          },
        ],
      },
      servers: [
        {
          url: 'https://{example_variable}.fantasy',
        },
      ],
    })

    expect(request).toMatchObject('https://unicorn.fantasy')
  })
})
