import { generateResponseContent } from 'src/helpers/generateResponseContent'
import { describe, expect, it } from 'vitest'

describe('generateResponseContent', () => {
  it('sets example values', () => {
    expect(
      generateResponseContent({
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
      generateResponseContent({
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
      generateResponseContent({
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
      generateResponseContent({
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
      generateResponseContent({
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
      generateResponseContent({
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
      generateResponseContent({
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
      generateResponseContent({
        id: {
          type: 'integer',
        },
      }),
    ).toMatchObject({
      id: 1,
    })
  })

  it('converts a whole schema to an example response', () => {
    const schema = {
      required: ['name', 'photoUrls'],
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          format: 'int64',
          example: 10,
        },
        name: {
          type: 'string',
          example: 'doggie',
        },
        category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Dogs',
            },
          },
          xml: {
            name: 'category',
          },
        },
        photoUrls: {
          type: 'array',
          xml: {
            wrapped: true,
          },
          items: {
            type: 'string',
            xml: {
              name: 'photoUrl',
            },
          },
        },
        tags: {
          type: 'array',
          xml: {
            wrapped: true,
          },
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              name: {
                type: 'string',
              },
            },
            xml: {
              name: 'tag',
            },
          },
        },
        status: {
          type: 'string',
          description: 'pet status in the store',
          enum: ['available', 'pending', 'sold'],
        },
      },
      xml: {
        name: 'pet',
      },
    }

    expect(generateResponseContent(schema.properties)).toMatchObject({
      id: 10,
      name: 'doggie',
      category: {
        id: 1,
        name: 'Dogs',
      },
      photoUrls: [],
      tags: [
        {
          id: 1,
          name: '',
        },
      ],
      status: 'available',
    })
  })
})
