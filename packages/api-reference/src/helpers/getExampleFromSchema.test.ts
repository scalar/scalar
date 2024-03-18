import { describe, expect, it } from 'vitest'

import { getExampleFromSchema } from './getExampleFromSchema'

describe('getExampleFromSchema', () => {
  it('sets example values', () => {
    expect(
      getExampleFromSchema({
        example: 10,
      }),
    ).toMatchObject(10)
  })

  it('uses first example, if multiple are configured', () => {
    expect(
      getExampleFromSchema({
        examples: [10],
      }),
    ).toMatchObject(10)
  })

  it('takes the first enum as example', () => {
    expect(
      getExampleFromSchema({
        enum: ['available', 'pending', 'sold'],
      }),
    ).toMatchObject('available')
  })

  it('uses empty quotes as a fallback for strings', () => {
    expect(
      getExampleFromSchema({
        type: 'string',
      }),
    ).toMatchObject('')
  })

  it('sets example values', () => {
    expect(
      getExampleFromSchema({
        example: 10,
      }),
    ).toMatchObject(10)
  })

  it('goes through properties recursively with objects', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
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
              attributes: {
                type: 'object',
                properties: {
                  size: {
                    enum: ['small', 'medium', 'large'],
                  },
                },
              },
            },
          },
        },
      }),
    ).toMatchObject({
      category: {
        id: 1,
        name: 'Dogs',
        attributes: {
          size: 'small',
        },
      },
    })
  })

  it('goes through properties recursively with arrays', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: {
              type: 'object',
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

  it('uses empty [] as a fallback for arrays', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
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

  it('uses given fallback for strings', () => {
    expect(
      getExampleFromSchema(
        {
          type: 'string',
        },
        {
          emptyString: '…',
        },
      ),
    ).toMatchObject('…')
  })

  it('uses true as a fallback for booleans', () => {
    expect(
      getExampleFromSchema({
        type: 'boolean',
      }),
    ).toMatchObject(true)
  })

  it('uses 1 as a fallback for integers', () => {
    expect(
      getExampleFromSchema({
        type: 'integer',
      }),
    ).toMatchObject(1)
  })

  it('returns an array if the schema type is array', () => {
    expect(
      getExampleFromSchema({
        type: 'array',
      }),
    ).toMatchObject([])
  })

  it('uses array example values', () => {
    expect(
      getExampleFromSchema({
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
      getExampleFromSchema({
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
        },
      }),
    ).toMatchObject([
      {
        foo: 1,
        bar: '',
      },
    ])
  })

  it('uses the first example in object anyOf', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        anyOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'number' },
            },
          },
          {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        ],
      }),
    ).toMatchObject({ foo: 1 })
  })

  it('uses the first example in object oneOf', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        oneOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'number' },
            },
          },
          {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        ],
      }),
    ).toMatchObject({ foo: 1 })
  })

  it('uses all examples in object allOf', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        allOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'number' },
            },
          },
          {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        ],
      }),
    ).toMatchObject({ foo: 1, bar: '' })
  })

  it('uses the first example in array anyOf', () => {
    expect(
      getExampleFromSchema({
        type: 'array',
        items: {
          anyOf: [
            {
              type: 'string',
              example: 'foobar',
            },
            {
              type: 'string',
              example: 'barfoo',
            },
          ],
        },
      }),
    ).toMatchObject(['foobar'])
  })

  it('uses one example in array oneOf', () => {
    expect(
      getExampleFromSchema({
        type: 'array',
        items: {
          oneOf: [
            {
              type: 'string',
              example: 'foobar',
            },
            {
              type: 'string',
              example: 'barfoo',
            },
          ],
        },
      }),
    ).toMatchObject(['foobar'])
  })

  it('uses all examples in array allOf', () => {
    expect(
      getExampleFromSchema({
        type: 'array',
        items: {
          allOf: [
            {
              type: 'string',
              example: 'foobar',
            },
            {
              type: 'string',
              example: 'barfoo',
            },
          ],
        },
      }),
    ).toMatchObject(['foobar', 'barfoo'])
  })

  it('uses the default value', () => {
    const schema = {
      type: 'string',
      default: 'BAD_REQUEST_EXCEPTION',
    }

    expect(getExampleFromSchema(schema)).toMatchObject('BAD_REQUEST_EXCEPTION')
  })

  it('uses 1 as the default for a number', () => {
    expect(
      getExampleFromSchema({
        type: 'number',
      }),
    ).toMatchObject(1)
  })

  it('uses min as the default for a number', () => {
    expect(
      getExampleFromSchema({
        type: 'number',
        min: 200,
      }),
    ).toMatchObject(200)
  })

  it('returns plaintext', () => {
    expect(
      getExampleFromSchema({
        type: 'string',
        example: 'foobar',
      }),
    ).toEqual('foobar')
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

    expect(getExampleFromSchema(schema)).toMatchObject({
      id: 10,
      name: 'doggie',
      category: {
        id: 1,
        name: 'Dogs',
      },
      photoUrls: [''],
      tags: [
        {
          id: 1,
          name: '',
        },
      ],
      status: 'available',
    })
  })

  it('outputs XML', () => {
    expect(
      getExampleFromSchema(
        {
          type: 'object',
          properties: {
            id: {
              example: 1,
              xml: {
                name: 'foo',
              },
            },
          },
        },
        { xml: true },
      ),
    ).toMatchObject({
      foo: 1,
    })
  })

  it('add XML wrappers where needed', () => {
    expect(
      getExampleFromSchema(
        {
          type: 'object',
          properties: {
            photoUrls: {
              type: 'array',
              xml: {
                wrapped: true,
              },
              items: {
                type: 'string',
                example: 'https://example.com',
                xml: {
                  name: 'photoUrl',
                },
              },
            },
          },
        },
        { xml: true },
      ),
    ).toMatchObject({
      photoUrls: [{ photoUrl: 'https://example.com' }],
    })
  })

  it('doesn’t wrap items when not needed', () => {
    expect(
      getExampleFromSchema(
        {
          type: 'object',
          properties: {
            photoUrls: {
              type: 'array',
              items: {
                type: 'string',
                example: 'https://example.com',
                xml: {
                  name: 'photoUrl',
                },
              },
            },
          },
        },
        { xml: true },
      ),
    ).toMatchObject({
      photoUrls: ['https://example.com'],
    })
  })

  it('use the first item of oneOf', () => {
    expect(
      getExampleFromSchema({
        oneOf: [
          {
            maxLength: 255,
            type: 'string',
          },
          {
            type: 'null',
          },
        ],
      }),
    ).toMatchObject('')
  })

  it('works with allOf', () => {
    expect(
      getExampleFromSchema({
        allOf: [
          {
            type: 'string',
          },
        ],
      }),
    ).toMatchObject('')
  })

  it('uses all schemas in allOf', () => {
    expect(
      getExampleFromSchema({
        allOf: [
          {
            type: 'object',
            properties: {
              id: {
                example: 10,
              },
            },
          },
          {
            type: 'object',
            properties: {
              title: {
                example: 'Foobar',
              },
            },
          },
        ],
      }),
    ).toMatchObject({
      id: 10,
      title: 'Foobar',
    })
  })

  it('returns null for unknown types', () => {
    expect(
      getExampleFromSchema({
        type: 'fantasy',
      }),
    ).toBe(null)
  })

  it('returns readOnly attributes by default', () => {
    expect(
      getExampleFromSchema({
        example: 'foobar',
        readOnly: true,
      }),
    ).toMatchObject('foobar')
  })

  it('returns readOnly attributes in read mode', () => {
    expect(
      getExampleFromSchema(
        {
          example: 'foobar',
          readOnly: true,
        },
        {
          mode: 'read',
        },
      ),
    ).toMatchObject('foobar')
  })

  it('doesn’t return readOnly attributes in write mode', () => {
    expect(
      getExampleFromSchema(
        {
          example: 'foobar',
          readOnly: true,
        },
        {
          mode: 'write',
        },
      ),
    ).toBe(undefined)
  })

  it('returns writeOnly attributes by default', () => {
    expect(
      getExampleFromSchema({
        example: 'foobar',
        writeOnly: true,
      }),
    ).toMatchObject('foobar')
  })

  it('returns writeOnly attributes in write mode', () => {
    expect(
      getExampleFromSchema(
        {
          example: 'foobar',
          writeOnly: true,
        },
        {
          mode: 'write',
        },
      ),
    ).toMatchObject('foobar')
  })

  it('doesn’t return writeOnly attributes in read mode', () => {
    expect(
      getExampleFromSchema(
        {
          example: 'foobar',
          writeOnly: true,
        },
        {
          mode: 'read',
        },
      ),
    ).toBe(undefined)
  })

  it('merges object from additionalProperties', () => {
    expect(
      getExampleFromSchema({
        properties: {
          myProperty: {
            additionalProperties: {
              properties: {
                propertyOne: {
                  type: 'string',
                  title: 'Message',
                },
                propertyTwo: {
                  type: 'string',
                  title: 'Message',
                },
              },
              type: 'object',
            },
            type: 'object',
            title: 'MyProperty',
          },
        },
        type: 'object',
      }),
    ).toMatchObject({
      myProperty: {
        propertyOne: '',
        propertyTwo: '',
      },
    })
  })

  it('adds a key-value pair example with the schema additionalProperties', () => {
    expect(
      getExampleFromSchema({
        properties: {
          myProperty: {
            additionalProperties: {
              type: 'string',
              title: 'Message',
            },
            type: 'object',
            title: 'MyProperty',
          },
        },
        type: 'object',
      }),
    ).toMatchObject({
      myProperty: {
        someKey: '',
      },
    })
  })

  it('overwrites with nullable additionalProperties schema', () => {
    expect(
      getExampleFromSchema({
        properties: {
          myProperty: {
            additionalProperties: {
              nullable: true,
            },
            type: 'object',
            title: 'MyProperty',
          },
        },
        type: 'object',
      }),
    ).toMatchObject({
      myProperty: null,
    })
  })
})
