import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { createFetchBody } from './create-fetch-body'

describe('createFetchBody', () => {
  it('should handle request method in lowercase', () => {
    const example: RequestExample = {
      uid: 'random-uid',
      name: 'foo',
      requestUid: 'other-random-uid',
      type: 'requestExample',
      body: {
        activeBody: 'raw',
        raw: {
          value: 'hello world',
          encoding: 'text',
        },
      },
      parameters: {
        headers: [],
        query: [],
        path: [],
        cookies: [],
      },
    }

    const result = createFetchBody('post', example, {})

    expect(result).toEqual({
      body: 'hello world',
      contentType: 'text',
    })
  })
})
