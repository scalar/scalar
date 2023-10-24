import { describe, expect, it } from 'vitest'

import {
  createEmptyAuthenticationState,
  createEmptyServerState,
} from '../stores/globalStore'
import type { Server, ServerState, TransformedOperation } from '../types'
import { getHarRequest } from './getHarRequest'

// const getUrlFromServerState = ({ serverState, servers }: { serverState: ServerState, servers: Server[]}) => ({

// })

// getUrlFromServerState({
//     serverState: {
//         ...createEmptyServerState(),
//         selectedServer: 0,
//     }
//   })

describe('getHarRequest', () => {
  it('transforms a basic operation', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      operation: {
        httpVerb: 'GET',
        path: '/foobar',
      } as TransformedOperation,
    })

    expect(request).toMatchObject({
      url: 'https://example.com/foobar',
      method: 'GET',
      headers: [],
    })
  })

  it('adds headers', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      additionalHeaders: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
      operation: {
        httpVerb: 'GET',
        path: '/foobar',
      } as TransformedOperation,
    })

    expect(request).toMatchObject({
      url: 'https://example.com/foobar',
      method: 'GET',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
    })
  })
})
