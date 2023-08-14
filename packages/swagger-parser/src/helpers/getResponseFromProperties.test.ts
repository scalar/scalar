import { getResponseFromProperties } from 'src/helpers/getResponseFromProperties'
import { describe, expect, it } from 'vitest'

describe('getResponseFromProperties', () => {
  it('sets example values', () => {
    expect(
      JSON.stringify(
        getResponseFromProperties({
          id: {
            example: 10,
          },
        }),
      ),
    ).toBe(
      JSON.stringify({
        id: 10,
      }),
    )
  })

  it('takes the first enum as example', () => {
    expect(
      JSON.stringify(
        getResponseFromProperties({
          status: {
            enum: ['available', 'pending', 'sold'],
          },
        }),
      ),
    ).toBe(
      JSON.stringify({
        status: 'available',
      }),
    )
  })

  it('goes through properties recursively with objects', () => {
    expect(
      JSON.stringify(
        getResponseFromProperties({
          category: {
            type: 'object',
            properties: {
              id: {
                example: 1,
              },
              name: {
                example: 'Dogs',
              },
            },
          },
        }),
      ),
    ).toBe(
      JSON.stringify({
        category: {
          id: 1,
          name: 'Dogs',
        },
      }),
    )
  })

  it('goes through properties recursively with arrays', () => {
    expect(
      JSON.stringify(
        getResponseFromProperties({
          tags: {
            type: 'array',
            items: {
              properties: {
                id: {},
              },
            },
          },
        }),
      ),
    ).toBe(
      JSON.stringify({
        tags: [
          {
            id: null,
          },
        ],
      }),
    )
  })
})
