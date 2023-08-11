import { getExampleResponses } from 'src/helpers/getExampleResponses'
import { describe, expect, it } from 'vitest'

describe.only('getExampleResponses', () => {
  it('returns the schema', () => {
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

    expect(JSON.stringify(exampleResponses)).toBe(
      JSON.stringify({
        200: {
          'application/json': {
            content: {
              id: 10,
            },
          },
        },
      }),
    )
  })
})
