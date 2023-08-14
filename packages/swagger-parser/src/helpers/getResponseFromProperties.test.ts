import { getResponseFromProperties } from 'src/helpers/getResponseFromProperties'
import { describe, expect, it } from 'vitest'

describe('getResponseFromProperties', () => {
  it('sets example values', () => {
    expect(
      getResponseFromProperties({
        id: {
          example: 10,
        },
      }),
    ).toMatchObject({
      id: 10,
    })
  })

  it('takes the first enum as example', () => {
    expect(
      getResponseFromProperties({
        status: {
          enum: ['available', 'pending', 'sold'],
        },
      }),
    ).toMatchObject({
      status: 'available',
    })
  })

  it('goes through properties recursively with objects', () => {
    expect(
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
    ).toMatchObject({
      category: {
        id: 1,
        name: 'Dogs',
      },
    })
  })

  it('goes through properties recursively with arrays', () => {
    expect(
      getResponseFromProperties({
        tags: {
          type: 'array',
          items: {
            properties: {
              id: {
                example: 1,
              },
            },
          },
        },
      }),
    ).toMatchObject({
      tags: [
        {
          id: 1,
        },
      ],
    })
  })

  it('uses empty quotes as a fallback for arrays', () => {
    expect(
      getResponseFromProperties({
        title: {
          type: 'array',
        },
      }),
    ).toMatchObject({
      title: [],
    })
  })

  it('uses empty quotes as a fallback for strings', () => {
    expect(
      getResponseFromProperties({
        title: {
          type: 'string',
        },
      }),
    ).toMatchObject({
      title: '',
    })
  })

  it('uses true as a fallback for booleans', () => {
    expect(
      getResponseFromProperties({
        public: {
          type: 'boolean',
        },
      }),
    ).toMatchObject({
      public: true,
    })
  })

  it('uses 1 as a fallback for integers', () => {
    expect(
      getResponseFromProperties({
        id: {
          type: 'integer',
        },
      }),
    ).toMatchObject({
      id: 1,
    })
  })
})
