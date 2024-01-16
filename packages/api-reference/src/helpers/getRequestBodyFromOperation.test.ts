import { describe, expect, it } from 'vitest'

import type { TransformedOperation } from '../types'
import { getRequestBodyFromOperation } from './getRequestBodyFromOperation'

describe('getRequestBodyFromOperation', () => {
  it('transforms a basic operation', () => {
    const request = getRequestBodyFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    example: 1,
                  },
                },
              },
            },
          },
        },
      },
    } as TransformedOperation)

    const expectedResult = {
      id: 1,
    }

    expect(request?.postData).toContain({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })
})
