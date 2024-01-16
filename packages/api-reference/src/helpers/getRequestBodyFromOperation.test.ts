import { describe, expect, it } from 'vitest'

import { getRequestBodyFromOperation } from './getRequestBodyFromOperation'

describe('getRequestBodyFromOperation', () => {
  it('creates a JSON body from a requestBody schema', () => {
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
                    type: 'integer',
                    example: 1,
                  },
                },
              },
            },
          },
        },
      },
    })

    const expectedResult = {
      id: 1,
    }

    expect(request?.postData).toContain({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })

  it('creates a JSON body from body parameters', () => {
    const request = getRequestBodyFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        parameters: [
          {
            name: 'body',
            in: 'body',
            schema: {
              type: 'object',
              properties: {
                id: {
                  name: 'id',
                  type: 'integer',
                  example: 1,
                },
              },
            },
          },
        ],
      },
    })

    const expectedResult = {
      id: 1,
    }

    expect(request?.postData).toContain({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })
})
