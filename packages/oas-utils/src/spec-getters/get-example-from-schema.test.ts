import { describe, expect, it } from 'vitest'

import { getExampleFromSchema } from './get-example-from-schema.ts'

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
    ).toBe('available')
  })

  it('uses empty quotes as a fallback for strings', () => {
    expect(
      getExampleFromSchema({
        type: 'string',
      }),
    ).toBe('')
  })

  it('only includes required attributes and attributes with example values', () => {
    expect(
      getExampleFromSchema(
        {
          type: 'object',
          required: ['first_name'],
          properties: {
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
              required: true,
            },
            position: {
              type: 'string',
              examples: ['Developer'],
            },
            description: {
              type: 'string',
              example: 'A developer',
            },
            age: {
              type: 'number',
            },
          },
        },
        {
          omitEmptyAndOptionalProperties: true,
        },
      ),
    ).toStrictEqual({
      first_name: '',
      last_name: '',
      position: 'Developer',
      description: 'A developer',
    })
  })

  it('includes every available attributes', () => {
    expect(
      getExampleFromSchema(
        {
          type: 'object',
          required: ['first_name'],
          properties: {
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
              required: true,
            },
            position: {
              type: 'string',
              examples: ['Developer'],
            },
            description: {
              type: 'string',
              example: 'A developer',
            },
            age: {
              type: 'number',
            },
          },
        },
        {
          omitEmptyAndOptionalProperties: false,
        },
      ),
    ).toStrictEqual({
      first_name: '',
      last_name: '',
      position: 'Developer',
      description: 'A developer',
      age: 1,
    })
  })

  it('uses example value for first type in non-null union types', () => {
    expect(
      getExampleFromSchema({
        type: ['string', 'number'],
      }),
    ).toBe('')
  })

  it('uses null for nullable union types', () => {
    expect(
      getExampleFromSchema({
        type: ['string', 'null'],
      }),
    ).toBeNull()
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
    ).toBe('…')
  })

  it('returns emails as an example value', () => {
    const result = getExampleFromSchema(
      {
        type: 'string',
        format: 'email',
      },
      {
        emptyString: '…',
      },
    )

    function isEmail(text: string) {
      return !!text.match(/^.+@.+\..+$/)
    }

    expect(isEmail(result)).toBe(true)
  })

  it('uses variables as an example value', () => {
    expect(
      getExampleFromSchema(
        {
          'type': 'string',
          'x-variable': 'id',
        },
        {
          variables: {
            id: 'foobar',
          },
        },
      ),
    ).toBe('foobar')
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

  it('uses the first example in object anyOf when type is not defined', () => {
    expect(
      getExampleFromSchema({
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

  it('uses the first example in object oneOf when type is not defined', () => {
    expect(
      getExampleFromSchema({
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

  it('merges allOf items in arrays', () => {
    expect(
      getExampleFromSchema({
        type: 'array',
        items: {
          allOf: [
            {
              type: 'object',
              properties: {
                foobar: { type: 'string' },
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
        },
      }),
    ).toMatchObject([{ foobar: '', foo: 1, bar: '' }])
  })

  it('handles array items with allOf containing objects', () => {
    expect(
      getExampleFromSchema({
        type: 'array',
        items: {
          allOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
              },
            },
            {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'test' },
              },
            },
          ],
        },
      }),
    ).toMatchObject([
      {
        id: 1,
        name: 'test',
      },
    ])
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

    expect(getExampleFromSchema(schema)).toBe('BAD_REQUEST_EXCEPTION')
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
    ).toBe('')
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
    ).toBe('')
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
    ).toBe('foobar')
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
    ).toBe('foobar')
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
    ).toBe('foobar')
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
    ).toBe('foobar')
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

  it('allows any additonalProperty', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: {},
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: 'anything',
    })

    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: true,
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: 'anything',
    })
  })

  it('adds an additionalProperty with specific types', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: {
          type: 'integer',
        },
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: 1,
    })

    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: {
          type: 'boolean',
        },
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: true,
    })

    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: {
          type: 'boolean',
          default: false,
        },
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: false,
    })

    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: '',
    })

    expect(
      getExampleFromSchema({
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      }),
    ).toMatchObject({
      ANY_ADDITIONAL_PROPERTY: {
        foo: '',
      },
    })
  })

  it('works with anyOf', () => {
    expect(
      getExampleFromSchema({
        title: 'Foo',
        type: 'object',
        anyOf: [
          {
            type: 'object',
            required: ['a'],
            properties: {
              a: {
                type: 'integer',
                format: 'int32',
              },
            },
          },
          {
            type: 'object',
            required: ['b'],
            properties: {
              b: {
                type: 'string',
              },
            },
          },
        ],
        required: ['c'],
        properties: {
          c: {
            type: 'boolean',
          },
        },
      }),
    ).toStrictEqual({
      a: 1,
      c: true,
    })
  })

  it('handles patternProperties', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        patternProperties: {
          '^(.*)$': {
            type: 'object',
            properties: {
              dataId: {
                type: 'string',
              },
              link: {
                anyOf: [
                  {
                    format: 'uri',
                    type: 'string',
                    example: 'https://example.com',
                  },
                  {
                    type: 'null',
                  },
                ],
              },
            },
            required: ['dataId', 'link'],
          },
        },
      }),
    ).toStrictEqual({
      '^(.*)$': {
        dataId: '',
        link: 'https://example.com',
      },
    })
  })

  describe('circular references', () => {
    it('deals with circular references', () => {
      const schema = {
        type: 'object',
        properties: {
          foobar: {},
        },
      }

      // Create a circular reference
      schema.properties.foobar = schema

      // 10 levels deep, that’s enough. It should return null then.
      expect(getExampleFromSchema(schema)).toStrictEqual({
        foobar: {
          foobar: {
            foobar: {
              foobar: {
                foobar: {
                  foobar: '[Circular Reference]',
                },
              },
            },
          },
        },
      })
    })

    it('deals with circular references that expand horizontally', () => {
      const schema = {
        type: 'object',
        properties: {
          a: {},
          b: {},
          c: {},
          d: {},
          e: {},
          f: {},
          g: {},
          h: {},
          i: {},
          j: {},
          k: {},
          l: {},
          m: {},
          n: {},
          o: {},
          p: {},
          q: {},
          r: {},
          s: {},
          t: {},
          u: {},
          v: {},
          w: {},
          x: {},
          y: {},
          z: {},
        },
      }

      // Create a circular reference for each property
      schema.properties.a = schema
      schema.properties.b = schema
      schema.properties.c = schema
      schema.properties.d = schema
      schema.properties.e = schema
      schema.properties.f = schema
      schema.properties.g = schema
      schema.properties.h = schema
      schema.properties.i = schema
      schema.properties.j = schema
      schema.properties.k = schema
      schema.properties.l = schema
      schema.properties.m = schema
      schema.properties.n = schema
      schema.properties.o = schema
      schema.properties.p = schema
      schema.properties.q = schema
      schema.properties.r = schema
      schema.properties.s = schema
      schema.properties.t = schema
      schema.properties.u = schema
      schema.properties.v = schema
      schema.properties.w = schema
      schema.properties.x = schema
      schema.properties.y = schema
      schema.properties.z = schema

      const example = getExampleFromSchema(schema)
      expect(example).toBeInstanceOf(Object)
      expect(Object.keys(example).length).toBe(26)
    })
  })

  it('omits deprecated properties', () => {
    expect(
      getExampleFromSchema({
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'test',
          },
          oldField: {
            type: 'string',
            example: 'should not appear',
            deprecated: true,
          },
        },
      }),
    ).toStrictEqual({
      name: 'test',
    })
  })
})
