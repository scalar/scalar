import { generateResponseContent } from 'src/helpers/generateResponseContent'
import { describe, expect, it } from 'vitest'

describe('generateResponseContent', () => {
  it('sets example values', () => {
    expect(
      generateResponseContent({
        properties: {
          id: {
            example: 10,
          },
        },
      }),
    ).toMatchObject({
      id: 10,
    })
  })

  it('takes the first enum as example', () => {
    expect(
      generateResponseContent({
        properties: {
          status: {
            enum: ['available', 'pending', 'sold'],
          },
        },
      }),
    ).toMatchObject({
      status: 'available',
    })
  })

  it('goes through properties recursively with objects', () => {
    expect(
      generateResponseContent({
        properties: {
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
        properties: {
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
        properties: {
          title: {
            type: 'array',
          },
        },
      }),
    ).toMatchObject({
      title: [],
    })
  })

  it('uses empty quotes as a fallback for strings', () => {
    expect(
      generateResponseContent({
        properties: {
          title: {
            type: 'string',
          },
        },
      }),
    ).toMatchObject({
      title: '',
    })
  })

  it('uses true as a fallback for booleans', () => {
    expect(
      generateResponseContent({
        properties: {
          public: {
            type: 'boolean',
          },
        },
      }),
    ).toMatchObject({
      public: true,
    })
  })

  it('uses 1 as a fallback for integers', () => {
    expect(
      generateResponseContent({
        properties: {
          id: {
            type: 'integer',
          },
        },
      }),
    ).toMatchObject({
      id: 1,
    })
  })

  it('returns an array if the schema type is array', () => {
    expect(
      generateResponseContent({
        type: 'array',
        items: {
          type: 'string',
        },
      }),
    ).toMatchObject([])
  })

  it('uses array example values', () => {
    expect(
      generateResponseContent({
        type: 'array',
        example: ['foobar'],
        items: {
          type: 'string',
        },
      }),
    ).toMatchObject(['foobar'])
  })

  it('uses specified object as array default', () => {
    expect(
      generateResponseContent({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: {
              type: 'number',
            },
            bar: {
              type: 'string',
            },
          },
          required: [
            {
              foo: 0,
              bar: '',
            },
          ],
        },
      }),
    ).toMatchObject([
      {
        foo: 0,
        bar: '',
      },
    ])
  })

  it('uses the default value', () => {
    const schema = {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          default: 400,
        },
        errorCode: {
          type: 'string',
          default: 'BAD_REQUEST_EXCEPTION',
        },
      },
    }

    expect(generateResponseContent(schema)).toMatchObject({
      statusCode: 400,
      errorCode: 'BAD_REQUEST_EXCEPTION',
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

    expect(generateResponseContent(schema)).toMatchObject({
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
