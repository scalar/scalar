import { getExampleResponses } from 'src/helpers/getExampleResponses'
import { describe, expect, it } from 'vitest'

describe('getExampleResponses', () => {
  it('returns an example response from a schema', () => {
    const responseSchema = {
      200: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  example: 10,
                },
              },
            },
          },
        },
      },
    }

    const exampleResponses = getExampleResponses(responseSchema)

    expect(exampleResponses).toMatchObject({
      200: {
        content: {
          'application/json': {
            example: JSON.stringify(
              {
                id: 10,
              },
              null,
              2,
            ),
            schema: {
              properties: {
                id: {
                  example: 10,
                },
              },
            },
          },
        },
      },
    })
  })
})
