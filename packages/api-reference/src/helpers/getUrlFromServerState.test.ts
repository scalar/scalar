import { describe, expect, it } from 'vitest'

import { createEmptyServerState } from '../stores/globalStore'
import { getUrlFromServerState } from './getUrlFromServerState'

describe('getUrlFromServerState', () => {
  it('gets an URL without variables', () => {
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
})
