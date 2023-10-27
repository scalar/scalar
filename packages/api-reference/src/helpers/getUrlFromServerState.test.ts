import { describe, expect, it } from 'vitest'

import { createEmptyServerState } from '../stores/globalStore'
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
})
