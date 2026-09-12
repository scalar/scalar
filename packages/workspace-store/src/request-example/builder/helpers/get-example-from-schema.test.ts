import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@/schemas/v3.1/strict/openapi-document'

import { getExampleFromSchema } from './get-example-from-schema'

describe('getExampleFromSchema', () => {
  it('sets example values', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 10,
        }),
      ),
    ).toBe(10)
  })

  it('uses first example, if multiple are configured', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          examples: [10],
        }),
      ),
    ).toBe(10)
  })

  it('takes the first enum as example', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          enum: ['available', 'pending', 'sold'],
        }),
      ),
    ).toBe('available')
  })

  it('uses empty quotes as a fallback for strings', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'string',
        }),
      ),
    ).toBe('')
  })

  it('only includes required attributes and attributes with example values', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'object',
          required: ['first_name', 'last_name'],
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
        }),
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
        coerceValue(SchemaObjectSchema, {
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
        }),
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
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: ['string', 'number'],
        }),
      ),
    ).toBe('')
  })

  it('uses null for nullable union types', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: ['string', 'null'],
        }),
      ),
    ).toBeNull()
  })

  it('sets example values', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 10,
        }),
      ),
    ).toBe(10)
  })

  it('goes through properties recursively with objects', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
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
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
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
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'object',
          properties: {
            title: {
              type: 'array',
            },
          },
        }),
      ),
    ).toMatchObject({
      title: [],
    })
  })

  it('uses given fallback for strings', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'string',
        }),
        {
          emptyString: '…',
        },
      ),
    ).toBe('…')
  })

  it('returns emails as an example value', () => {
    const result = getExampleFromSchema(
      coerceValue(SchemaObjectSchema, {
        type: 'string',
        format: 'email',
      }),
      {
        emptyString: '…',
      },
    )

    expect(result).toBe('hello@example.com')
  })

  it('uses a uuid example for version-specific uuid formats', () => {
    for (const format of ['uuid', 'uuid1', 'uuid3', 'uuid4', 'uuid5']) {
      const result = getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'string',
          format,
        }),
        {
          emptyString: '…',
        },
      )

      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000')
    }
  })

  it('uses variables as an example value', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          'type': 'string',
          'x-variable': 'id',
        }),
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
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'boolean',
        }),
      ),
    ).toBe(true)
  })

  it('uses 1 as a fallback for integers', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'integer',
        }),
      ),
    ).toBe(1)
  })

  it('returns an array if the schema type is array', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'array',
        }),
      ),
    ).toMatchObject([])
  })

  it('uses array example values', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'array',
          example: ['foobar'],
          items: {
            type: 'string',
          },
        }),
      ),
    ).toMatchObject(['foobar'])
  })

  it('uses specified object as array default', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject([
      {
        foo: 1,
        bar: '',
      },
    ])
  })

  it('uses the first example in object anyOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject({ foo: 1 })
  })

  it('uses the first example in object oneOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject({ foo: 1 })
  })

  it('uses the first example in object anyOf when type is not defined', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject({ foo: 1 })
  })

  it('uses compositionSelection to pick second anyOf variant for example', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      anyOf: [
        { type: 'object', properties: { foo: { type: 'number' } } },
        { type: 'object', properties: { bar: { type: 'string' } } },
      ],
    })
    expect(
      getExampleFromSchema(
        schema,
        {
          compositionSelection: {
            'requestBody.anyOf': 0,
          },
        },
        {
          schemaPath: ['requestBody'],
        },
      ),
    ).toMatchObject({
      foo: 1,
    })
    expect(
      getExampleFromSchema(
        schema,
        {
          compositionSelection: {
            'requestBody.anyOf': 1,
          },
        },
        {
          schemaPath: ['requestBody'],
        },
      ),
    ).toMatchObject({
      bar: '',
    })
  })

  it('uses compositionSelection for root-level oneOf/anyOf in example', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      anyOf: [{ type: 'string' }, { type: 'object', properties: { id: { type: 'integer' } } }],
    })
    expect(
      getExampleFromSchema(
        schema,
        {
          compositionSelection: {
            'requestBody.anyOf': 0,
          },
        },
        {
          schemaPath: ['requestBody'],
        },
      ),
    ).toBe('')
    expect(
      getExampleFromSchema(
        schema,
        {
          compositionSelection: {
            'requestBody.anyOf': 1,
          },
        },
        {
          schemaPath: ['requestBody'],
        },
      ),
    ).toMatchObject({
      id: 1,
    })
  })

  it('uses compositionSelection for nested anyOf schemas in objects', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        payload: {
          anyOf: [
            {
              type: 'object',
              properties: {
                firstNestedField: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                secondNestedField: { type: 'integer' },
              },
            },
          ],
        },
      },
    })

    expect(
      getExampleFromSchema(
        schema,
        {
          compositionSelection: {
            'requestBody.payload.anyOf': 1,
          },
        },
        {
          schemaPath: ['requestBody'],
        },
      ),
    ).toMatchObject({
      payload: {
        secondNestedField: 1,
      },
    })
  })

  it('uses the first example in object oneOf when type is not defined', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject({ foo: 1 })
  })

  it('uses all examples in object allOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject({ foo: 1, bar: '' })
  })

  it('merges allOf items in arrays', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject([{ foobar: '', foo: 1, bar: '' }])
  })

  it('handles array items with allOf containing objects', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject([
      {
        id: 1,
        name: 'test',
      },
    ])
  })

  it('uses the first example in array anyOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject(['foobar'])
  })

  it('uses one example in array oneOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject(['foobar'])
  })

  it('uses all examples in array allOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject(['foobar', 'barfoo'])
  })

  it('uses the default value', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'string',
      default: 'BAD_REQUEST_EXCEPTION',
    })

    expect(getExampleFromSchema(schema)).toBe('BAD_REQUEST_EXCEPTION')
  })

  it('ignores invalid defaults when they do not match primitive schema type', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'number',
      default: 'invalid',
    })

    expect(getExampleFromSchema(schema)).toBe(1)
  })

  it('normalizes empty string defaults to null for nullable integers', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: ['integer', 'null'],
      default: '',
    })

    expect(getExampleFromSchema(schema)).toBeNull()
  })

  it('ignores invalid defaults for composed schemas', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      oneOf: [{ type: 'string' }, { type: 'null' }],
      default: 123,
    })

    expect(getExampleFromSchema(schema)).toBe('')
  })

  it('does not recurse forever when validating defaults on circular composed schemas', () => {
    const schema = {
      type: 'object',
      default: {},
      anyOf: [],
    } as SchemaObject

    schema.anyOf = [schema]

    expect(getExampleFromSchema(schema)).toStrictEqual({})
  })

  it('keeps empty string defaults for nullable strings', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: ['string', 'null'],
      default: '',
    })

    expect(getExampleFromSchema(schema)).toBe('')
  })

  it('uses the const value', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'string',
      const: 'BAD_REQUEST_EXCEPTION',
    })

    expect(getExampleFromSchema(schema)).toBe('BAD_REQUEST_EXCEPTION')
  })

  it('uses 1 as the default for a number', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'number',
        }),
      ),
    ).toBe(1)
  })

  it('uses min as the default for a number', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'number',
          minimum: 200,
        }),
      ),
    ).toBe(200)
  })

  it('returns plaintext', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'string',
          example: 'foobar',
        }),
      ),
    ).toEqual('foobar')
  })

  it('converts a whole schema to an example response', () => {
    const schema = coerceValue(SchemaObjectSchema, {
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
    })

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

  describe('XML handling', () => {
    it('outputs XML', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              id: {
                example: 1,
                xml: {
                  name: 'foo',
                },
              },
            },
          }),
          { xml: true },
        ),
      ).toMatchObject({
        foo: 1,
      })
    })

    it('uses the xml.name for the root element if present', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            xml: {
              name: 'foobar',
            },
            properties: {
              id: {
                example: 1,
                xml: {
                  name: 'foo',
                },
              },
            },
          }),
          {
            xml: true,
          },
        ),
      ).toMatchObject({
        foobar: {
          foo: 1,
        },
      })
    })

    it('add XML wrappers where needed', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
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
          }),
          { xml: true },
        ),
      ).toMatchObject({
        photoUrls: [{ photoUrl: 'https://example.com' }],
      })
    })

    it(`doesn't wrap items when not needed`, () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
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
          }),
          { xml: true },
        ),
      ).toMatchObject({
        photoUrls: ['https://example.com'],
      })
    })
  })

  it('use the first item of oneOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toBe('')
  })

  it('does not use the first item of oneOf if it is null', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          oneOf: [
            {
              type: 'null',
            },
            {
              maxLength: 255,
              type: 'string',
            },
          ],
        }),
      ),
    ).toBe('')
  })

  it('uses the first item of oneOf if there is only one item', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          oneOf: [
            {
              type: 'null',
            },
          ],
        }),
      ),
    ).toBe(null)
  })

  it('works with allOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          allOf: [
            {
              type: 'string',
            },
          ],
        }),
      ),
    ).toBe('')
  })

  it('uses all schemas in allOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toMatchObject({
      id: 10,
      title: 'Foobar',
    })
  })

  it('returns null for unknown types', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          type: 'fantasy',
        }),
      ),
    ).toBe(null)
  })

  it('returns readOnly attributes by default', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 'foobar',
          readOnly: true,
        }),
      ),
    ).toBe('foobar')
  })

  it('returns readOnly attributes in read mode', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 'foobar',
          readOnly: true,
        }),
        {
          mode: 'read',
        },
      ),
    ).toBe('foobar')
  })

  it(`doesn't return readOnly attributes in write mode`, () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 'foobar',
          readOnly: true,
        }),
        {
          mode: 'write',
        },
      ),
    ).toBe(undefined)
  })

  it('returns writeOnly attributes by default', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 'foobar',
          writeOnly: true,
        }),
      ),
    ).toBe('foobar')
  })

  it('returns writeOnly attributes in write mode', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 'foobar',
          writeOnly: true,
        }),
        {
          mode: 'write',
        },
      ),
    ).toBe('foobar')
  })

  it(`doesn't return writeOnly attributes in read mode`, () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          example: 'foobar',
          writeOnly: true,
        }),
        {
          mode: 'read',
        },
      ),
    ).toBe(undefined)
  })

  describe('additionalProperties', () => {
    it('allows any additonalProperty', () => {
      expect(
        getExampleFromSchema({
          type: 'object',
          additionalProperties: {},
        } as SchemaObject),
      ).toMatchObject({
        'additionalProperty': 'anything',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: true,
          }),
        ),
      ).toMatchObject({
        'additionalProperty': 'anything',
      })
    })

    it('adds an additionalProperty with specific types', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': 1,
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'boolean',
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': true,
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'boolean',
              default: false,
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': false,
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': '',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
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
        ),
      ).toMatchObject({
        'additionalProperty': {
          foo: '',
        },
      })
    })

    it('uses x-additionalPropertiesName when provided', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': 'customField',
            },
          }),
        ),
      ).toMatchObject({
        'customField': '',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'integer',
              'x-additionalPropertiesName': 'sensorId',
            },
          }),
        ),
      ).toMatchObject({
        'sensorId': 1,
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'boolean',
              'x-additionalPropertiesName': 'isActive',
            },
          }),
        ),
      ).toMatchObject({
        'isActive': true,
      })
    })

    it('uses x-additionalPropertiesName with complex object types', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'object',
              'x-additionalPropertiesName': 'metadata',
              properties: {
                key: {
                  type: 'string',
                  example: 'version',
                },
                value: {
                  type: 'string',
                  example: '1.0.0',
                },
              },
            },
          }),
        ),
      ).toMatchObject({
        'metadata': {
          key: 'version',
          value: '1.0.0',
        },
      })
    })

    it('uses x-additionalPropertiesName with any type (additionalProperties: true)', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              'x-additionalPropertiesName': 'dynamicField',
            },
          }),
        ),
      ).toMatchObject({
        'dynamicField': null,
      })
    })

    it('uses x-additionalPropertiesName with empty object (additionalProperties: {})', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              'x-additionalPropertiesName': 'flexibleProperty',
            },
          }),
        ),
      ).toMatchObject({
        'flexibleProperty': null,
      })
    })

    it('trims whitespace from x-additionalPropertiesName', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': '  trimmedField  ',
            },
          }),
        ),
      ).toMatchObject({
        'trimmedField': '',
      })
    })

    it('falls back to additionalProperty when x-additionalPropertiesName is empty string', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': '',
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': '',
      })
    })

    it('falls back to additionalProperty when x-additionalPropertiesName is only whitespace', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': '   ',
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': '',
      })
    })

    it('does not add additional properties when additionalProperties is false', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: false,
          }),
        ),
      ).toEqual({
        name: '',
      })
    })

    it('coerces the type when x-additionalPropertiesName is not a string', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': 123,
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': '',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': null,
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': '',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': {},
            },
          }),
        ),
      ).toMatchObject({
        'additionalProperty': '',
      })
    })

    it('handles x-additionalPropertiesName with special characters', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': 'field-name',
            },
          }),
        ),
      ).toMatchObject({
        'field-name': '',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': 'field_name',
            },
          }),
        ),
      ).toMatchObject({
        'field_name': '',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: {
              type: 'string',
              'x-additionalPropertiesName': 'fieldName',
            },
          }),
        ),
      ).toMatchObject({
        'fieldName': '',
      })
    })

    it('works with x-additionalPropertiesName in nested schemas', () => {
      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              config: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                  'x-additionalPropertiesName': 'setting',
                },
              },
            },
          }),
        ),
      ).toMatchObject({
        config: {
          'setting': '',
        },
      })
    })

    it('handles multiple additionalProperties with different x-additionalPropertiesName', () => {
      // This test demonstrates that the function correctly handles
      // the x-additionalPropertiesName extension in different contexts
      const schema1 = coerceValue(SchemaObjectSchema, {
        type: 'object',
        additionalProperties: {
          type: 'string',
          'x-additionalPropertiesName': 'tag',
        },
      })

      const schema2 = coerceValue(SchemaObjectSchema, {
        type: 'object',
        additionalProperties: {
          type: 'number',
          'x-additionalPropertiesName': 'score',
        },
      })

      expect(getExampleFromSchema(schema1)).toMatchObject({
        'tag': '',
      })

      expect(getExampleFromSchema(schema2)).toMatchObject({
        'score': 1,
      })
    })

    it('uses first propertyNames enum value as example key', () => {
      expect(
        getExampleFromSchema({
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
          propertyNames: {
            type: 'string',
            enum: ['enabled', 'disabled'],
            title: 'DnssecStatus',
          },
        } as SchemaObject),
      ).toMatchObject({
        'enabled': '',
      })
    })

    it('uses first propertyNames enum value with integer values', () => {
      expect(
        getExampleFromSchema({
          type: 'object',
          additionalProperties: {
            type: 'integer',
          },
          propertyNames: {
            type: 'string',
            enum: ['cpu', 'memory', 'disk'],
          },
        } as SchemaObject),
      ).toMatchObject({
        'cpu': 1,
      })
    })

    it('prefers x-additionalPropertiesName over propertyNames', () => {
      expect(
        getExampleFromSchema({
          type: 'object',
          additionalProperties: {
            type: 'string',
            'x-additionalPropertiesName': 'customName',
          },
          propertyNames: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        } as SchemaObject),
      ).toMatchObject({
        'customName': '',
      })
    })

    it('falls back to default name when propertyNames has no enum', () => {
      expect(
        getExampleFromSchema({
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
          propertyNames: {
            type: 'string',
            minLength: 1,
          },
        } as SchemaObject),
      ).toMatchObject({
        'additionalProperty': '',
      })
    })
  })

  it('works with anyOf', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toStrictEqual({
      a: 1,
      c: true,
    })
  })

  it('handles patternProperties', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toStrictEqual({
      '^(.*)$': {
        dataId: '',
        link: 'https://example.com',
      },
    })
  })

  describe('circular references', () => {
    it('skips circular references', () => {
      const schema = {
        type: 'object',
        properties: {
          foobar: {
            type: 'object',
          },
        },
      } satisfies SchemaObject

      // Create a circular reference
      schema.properties!.foobar = schema

      // Circular references should be skipped entirely
      expect(getExampleFromSchema(schema)).toStrictEqual({})
    })

    it('skips circular references that expand horizontally', () => {
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
      } as any

      // Create a circular reference for each property
      schema.properties!.a = schema
      schema.properties!.b = schema
      schema.properties!.c = schema
      schema.properties!.d = schema
      schema.properties!.e = schema
      schema.properties!.f = schema
      schema.properties!.g = schema
      schema.properties!.h = schema
      schema.properties!.i = schema
      schema.properties!.j = schema
      schema.properties!.k = schema
      schema.properties!.l = schema
      schema.properties!.m = schema
      schema.properties!.n = schema
      schema.properties!.o = schema
      schema.properties!.p = schema
      schema.properties!.q = schema
      schema.properties!.r = schema
      schema.properties!.s = schema
      schema.properties!.t = schema
      schema.properties!.u = schema
      schema.properties!.v = schema
      schema.properties!.w = schema
      schema.properties!.x = schema
      schema.properties!.y = schema
      schema.properties!.z = schema

      // Circular references should be skipped entirely
      const example = getExampleFromSchema(schema)
      expect(example).toStrictEqual({})
    })
  })

  it('omits deprecated properties', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
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
      ),
    ).toStrictEqual({
      name: 'test',
    })
  })

  it('expands objects and arrays in arrays (without a type)', () => {
    expect(
      getExampleFromSchema(
        coerceValue(SchemaObjectSchema, {
          'type': 'array',
          'description': "The summary of user's quality of service (QoS) information.",
          'items': {
            // no `type: 'object'` here, but it's an object
            'properties': {
              'type': {
                'type': 'string',
                'enum': ['audio_input', 'audio_output', 'video_input'],
                'examples': ['audio_input'],
              },
              'details': {
                'type': 'object',
                'properties': {
                  'min_bitrate': {
                    'type': 'string',
                    'description': 'The minimum amount of bitrate, in Kbps.',
                    'examples': ['27.15 Kbps'],
                  },
                },
              },
              'foobar': {
                'type': 'array',
                'items': {
                  // no `type: 'array'` here, but it's an array
                  'items': {
                    'type': 'string',
                    'example': 'foobar',
                  },
                },
              },
            },
          },
        }),
      ),
    ).toStrictEqual([
      {
        'type': 'audio_input',
        'details': {
          'min_bitrate': '27.15 Kbps',
        },
        'foobar': [['foobar']],
      },
    ])
  })

  describe('maximum depth', () => {
    // Levels 0 through 10 render, so a leaf nested eleven deep is the first schema the walk truncates.
    // These mirror `MAX_LEVELS_DEEP` in the module, which is private: moving the cap without moving
    // these is meant to fail the boundary case below rather than pass quietly.
    const RENDERED_DEPTH = 10
    const TRUNCATED_DEPTH = 11

    /** Nest `depth` object schemas inside each other, chained through a `next` property. */
    const nestObjects = (depth: number, leaf: SchemaObject): SchemaObject =>
      depth === 0 ? leaf : { type: 'object', properties: { next: nestObjects(depth - 1, leaf) } }

    /** Nest `depth` array schemas inside each other, chained through `items`. */
    const nestArrays = (depth: number, leaf: SchemaObject): SchemaObject =>
      depth === 0 ? leaf : { type: 'array', items: nestArrays(depth - 1, leaf) }

    /** Follow a generated `next` chain down to the value the walk left at the bottom. */
    const deepestNext = (example: unknown): unknown => {
      let current = example
      while (current !== null && typeof current === 'object' && 'next' in current) {
        current = (current as { next: unknown }).next
      }
      return current
    }

    // Only the leaf is coerced, never the chain: coercion deep-clones, and some cases below depend on
    // the chain sharing object identity the way a dereferenced document does.
    /** Generate the example for `leaf` placed at the first depth the walk truncates. */
    const truncate = (leaf: unknown, options?: Parameters<typeof getExampleFromSchema>[1]): unknown =>
      deepestNext(getExampleFromSchema(nestObjects(TRUNCATED_DEPTH, coerceValue(SchemaObjectSchema, leaf)), options))

    /** Generate the example for `leaf` placed at the deepest level the walk still renders in full. */
    const render = (leaf: unknown): unknown =>
      deepestNext(getExampleFromSchema(nestObjects(RENDERED_DEPTH, coerceValue(SchemaObjectSchema, leaf))))

    it('renders the deepest level it reaches and truncates the next one', () => {
      // `const` pins the child so the two sides differ only by the boundary, not by their own depth.
      const leaf = { type: 'object', properties: { id: { type: 'string', const: 'kept' } } }

      expect(render(leaf)).toStrictEqual({ id: 'kept' })
      expect(truncate(leaf)).toStrictEqual({})
    })

    it('truncates an object schema with an empty object', () => {
      expect(truncate({ type: 'object', properties: { id: { type: 'string' } } })).toStrictEqual({})
    })

    it('truncates an array schema with an empty array', () => {
      expect(truncate({ type: 'array', items: { type: 'string' } })).toStrictEqual([])
    })

    it('truncates a schema that implies its container without declaring a type', () => {
      expect(truncate({ properties: { id: { type: 'string' } } })).toStrictEqual({})
      expect(truncate({ items: { type: 'string' } })).toStrictEqual([])
    })

    it('truncates a single-element type array like the bare type', () => {
      // `type: ['object']` is a legal spelling of `type: 'object'` and has to behave the same way.
      expect(truncate({ type: ['object'] })).toStrictEqual({})
      expect(truncate({ type: ['array'] })).toStrictEqual([])
    })

    it('truncates scalar schemas with a value of that type', () => {
      expect(truncate({ type: 'number' })).toBe(1)
      expect(truncate({ type: 'integer', minimum: 7 })).toBe(7)
      expect(truncate({ type: 'boolean' })).toBe(true)
      expect(truncate({ type: 'string' })).toBe('')
      expect(truncate({ type: 'null' })).toBe(null)
    })

    it('truncates a nullable union with null', () => {
      expect(truncate({ type: ['string', 'null'] })).toBe(null)
    })

    it('honors the emptyString option while truncating', () => {
      expect(truncate({ type: 'string' }, { emptyString: 'placeholder' })).toBe('placeholder')
    })

    it('prefers a declared value over a stand-in while truncating', () => {
      // The cap sits below the example precedence block, so a schema that says what it holds is taken
      // at its word rather than answered with an empty value it forbids.
      expect(truncate({ type: 'string', enum: ['active', 'archived'] })).toBe('active')
      expect(truncate({ type: 'string', const: 'v2' })).toBe('v2')
      expect(truncate({ type: 'object', example: { id: 'abc' } })).toStrictEqual({ id: 'abc' })
      expect(truncate({ type: 'object', examples: [{ id: 'first' }] })).toStrictEqual({ id: 'first' })
      expect(truncate({ type: 'string', default: 'fallback' })).toBe('fallback')
    })

    it('omits a truncated property the mode excludes', () => {
      // Omission is decided above the cap too, so a property the caller asked to leave out stays out
      // rather than coming back as a stand-in: its parent loses the key entirely.
      expect(truncate({ type: 'string', readOnly: true }, { mode: 'write' })).toStrictEqual({})
      expect(truncate({ type: 'string' }, { mode: 'write' })).toBe('')
    })

    it('truncates a multi-type union with a value of its first type', () => {
      expect(truncate({ type: ['integer', 'string'] })).toBe(1)
    })

    it('truncates a composition wrapper with the container its members declare', () => {
      expect(truncate({ allOf: [{ type: 'object', properties: { id: { type: 'string' } } }] })).toStrictEqual({})
      expect(truncate({ anyOf: [{ type: 'array', items: { type: 'string' } }] })).toStrictEqual([])
      // A wrapper around a wrapper: unwrapping has to keep going rather than stop at the first hop.
      expect(
        truncate({ oneOf: [{ allOf: [{ type: 'object', properties: { id: { type: 'string' } } }] }] }),
      ).toStrictEqual({})
    })

    it('skips composition members that describe nothing', () => {
      // Order matters: a member that describes nothing must not clobber one that does, whichever side
      // of the merge it lands on.
      expect(truncate({ allOf: [{ description: 'no shape' }, { type: 'object', properties: {} }] })).toStrictEqual({})
      expect(truncate({ allOf: [{ type: 'object', properties: {} }, { description: 'no shape' }] })).toStrictEqual({})
    })

    it('truncates a composition nothing can describe with null', () => {
      // The walk answers an unrenderable composition with null, and null is the one value a `oneOf` of
      // nulls actually permits.
      expect(truncate({ oneOf: [{ type: 'null' }] })).toBe(null)
      // More wrappers than the unwrapping is willing to follow, so it gives up the same way.
      const deeplyWrapped = new Array(8)
        .fill(null)
        .reduce<unknown>((inner) => ({ allOf: [inner] }), { type: 'object', properties: {} })
      expect(truncate(deeplyWrapped)).toBe(null)
    })

    it('terminates on a composition that references itself', () => {
      // Unwrapping runs outside the walk's cycle guard, so its own hop budget is the only thing
      // standing between a self-referencing wrapper and a hang.
      const cyclic: Record<string, unknown> = {}
      cyclic.allOf = [cyclic]

      expect(truncate(cyclic)).toBe(null)
    })

    it('follows an explicit selection through an allOf-wrapped composition', () => {
      // The pickers key a wrapped choice by its ordinal within the allOf, so truncation has to build
      // the same key or it silently renders the wrong variant.
      const leaf = {
        allOf: [
          {
            oneOf: [
              { type: 'object', properties: { id: { type: 'string' } } },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        ],
      }
      const selectionKey = new Array(TRUNCATED_DEPTH).fill('next').join('.')

      expect(truncate(leaf, { compositionSelection: { [`${selectionKey}.0.oneOf`]: 1 } })).toStrictEqual([])
    })

    it('truncates a composition of scalars with a scalar', () => {
      expect(truncate({ oneOf: [{ type: 'integer' }, { type: 'boolean' }] })).toBe(1)
    })

    it('follows an explicit composition selection while truncating', () => {
      // The picker chose the array variant, so the truncated value has to be an array too — otherwise
      // the rendered example changes kind purely because of how deep it sits.
      const leaf = {
        oneOf: [
          { type: 'object', properties: { id: { type: 'string' } } },
          { type: 'array', items: { type: 'string' } },
        ],
      }
      const selectionKey = new Array(TRUNCATED_DEPTH).fill('next').join('.')

      expect(truncate(leaf, { compositionSelection: { [`${selectionKey}.oneOf`]: 1 } })).toStrictEqual([])
    })

    it('keeps the sentinel when the schema declares no shape', () => {
      expect(truncate({ description: 'anything goes' })).toBe('[Max Depth Exceeded]')
    })

    it('leaves no sentinel in a chain that alternates objects and arrays', () => {
      // Whichever container the cap lands on has to be replaced by one of the same kind, so a mixed
      // chain comes back clean wherever the cut falls.
      const alternating = (depth: number): SchemaObject =>
        depth === 0
          ? { type: 'string' }
          : depth % 2 === 0
            ? { type: 'object', properties: { next: alternating(depth - 1) } }
            : { type: 'array', items: alternating(depth - 1) }

      expect(JSON.stringify(getExampleFromSchema(alternating(30)))).not.toContain('Max Depth Exceeded')
    })

    it('truncates every level of a chain deeper than the cap', () => {
      // Nesting far past the boundary still ends in exactly one stand-in, at the first truncated level.
      const example = getExampleFromSchema(nestArrays(30, { type: 'string' }))

      let expected: unknown = []
      for (let depth = 0; depth < TRUNCATED_DEPTH; depth++) {
        expected = [expected]
      }
      expect(example).toStrictEqual(expected)
    })

    it('does not let a truncated value stand in for a shallower use of the same schema', () => {
      // Results are cached by schema identity under a key that carries no level, and an `allOf` member
      // climbs a level without growing the schema path. So a schema rendered just above the cap in one
      // chain shares its key with the same schema used at the top of the document, and without care the
      // shallow use is served the truncated result. `$ref` resolution hands back one shared node, which
      // is what the reused object here stands for — `coerceValue` would clone it and hide the problem.
      const shared = {
        type: 'object',
        properties: { inner: { type: 'object', properties: { id: { type: 'string' } } } },
      }
      const wrap = (depth: number, leaf: unknown): unknown => (depth === 0 ? leaf : wrap(depth - 1, { allOf: [leaf] }))

      // The wrapped copy renders one level above the cap, so its own child truncates; the second member
      // is the very same object, reached at the top.
      const root = { allOf: [wrap(RENDERED_DEPTH - 1, shared), shared] } as unknown as SchemaObject

      expect(getExampleFromSchema(root)).toStrictEqual({ inner: { id: '' } })
    })
  })

  describe('caching', () => {
    it('returns different results when different options are passed', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'number',
          },
          email: {
            type: 'string',
          },
        },
      })

      const withoutOmit = getExampleFromSchema(schema, {
        omitEmptyAndOptionalProperties: false,
      })
      const withOmit = getExampleFromSchema(schema, {
        omitEmptyAndOptionalProperties: true,
      })
      const withoutOmitAgain = getExampleFromSchema(schema, {
        omitEmptyAndOptionalProperties: false,
      })

      expect(withoutOmit).toStrictEqual({
        name: '',
        age: 1,
        email: '',
      })
      expect(withOmit).toStrictEqual({
        name: '',
      })
      expect(withoutOmitAgain).toStrictEqual({
        name: '',
        age: 1,
        email: '',
      })
    })

    it('returns the same cached object reference for identical calls', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 123,
              },
              name: {
                type: 'string',
                example: 'John Doe',
              },
            },
          },
        },
      })

      const firstCall = getExampleFromSchema(schema)
      const secondCall = getExampleFromSchema(schema)
      const thirdCall = getExampleFromSchema(schema)

      // All calls should return the exact same object reference from cache
      expect(firstCall).toBe(secondCall)
      expect(secondCall).toBe(thirdCall)

      // Verify the nested object is also cached
      expect((firstCall as any).user).toBe((secondCall as any).user)
      expect((secondCall as any).user).toBe((thirdCall as any).user)
    })
  })

  describe('x-order', () => {
    it('orders properties by their x-order value', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: {
          name: { type: 'string', 'x-order': 1 },
          description: { type: 'string', 'x-order': 3 },
          diameter: { type: 'number', 'x-order': 2 },
        },
      })

      expect(Object.keys(getExampleFromSchema(schema) as object)).toEqual(['name', 'diameter', 'description'])
    })

    it('places properties with x-order before those without, keeping insertion order for the rest', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: {
          alpha: { type: 'string' },
          beta: { type: 'string', 'x-order': 2 },
          gamma: { type: 'string' },
          delta: { type: 'string', 'x-order': 1 },
        },
      })

      expect(Object.keys(getExampleFromSchema(schema) as object)).toEqual(['delta', 'beta', 'alpha', 'gamma'])
    })

    it('sorts x-order numerically, not lexically', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: {
          a: { type: 'string', 'x-order': 10 },
          b: { type: 'string', 'x-order': 2 },
          c: { type: 'string', 'x-order': 1 },
        },
      })

      expect(Object.keys(getExampleFromSchema(schema) as object)).toEqual(['c', 'b', 'a'])
    })
  })

  describe('$dynamicRef resolution', () => {
    // Cast helper so tests can use the untyped 2020-12 keywords ($defs) and a magic-proxy-style $ref-value.
    const dyn = (value: Record<string, unknown>) => value as unknown as SchemaObject

    // A shared generic pagination template. Its item type is a $dynamicRef whose fallback matches nothing.
    const paginatedTemplate = {
      $id: 'urn:template',
      $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
      type: 'object',
      required: ['items', 'total'],
      properties: {
        items: { type: 'array', items: { $dynamicRef: '#itemType' } },
        total: { type: 'integer', minimum: 0 },
      },
    }

    // A response specializing the template by binding itemType through a sibling $ref (as the magic proxy stores it).
    const responseBinding = (itemSchema: Record<string, unknown>) =>
      dyn({
        $id: 'urn:response',
        $defs: { itemType: { $dynamicAnchor: 'itemType', ...itemSchema } },
        '$ref': 'urn:template',
        '$ref-value': paginatedTemplate,
      })

    it('binds the dynamic item type to the specializing schema', () => {
      const example = getExampleFromSchema(
        responseBinding({ type: 'object', required: ['id', 'email'], properties: { id: {}, email: {} } }),
      ) as { items: Record<string, unknown>[] }

      expect(Array.isArray(example.items)).toBe(true)
      expect(example.items).toHaveLength(1)
      expect(example.items[0]).toHaveProperty('id')
      expect(example.items[0]).toHaveProperty('email')
    })

    it('resolves the same template to different item types per binding', () => {
      const groups = getExampleFromSchema(responseBinding({ type: 'object', properties: { name: {} } })) as {
        items: Record<string, unknown>[]
      }

      expect(groups.items[0]).toHaveProperty('name')
      expect(groups.items[0]).not.toHaveProperty('email')
    })

    it('falls back to the template anchor when no binding is in scope', () => {
      // Rendering the template directly leaves the dynamic items unresolvable, so the array stays empty.
      const example = getExampleFromSchema(dyn(paginatedTemplate)) as { items: unknown[] }
      expect(example.items).toEqual([])
    })

    it('resolves recursive $dynamicRef to the active extended type', () => {
      const baseCategory = {
        $id: 'urn:base',
        $dynamicAnchor: 'category',
        type: 'object',
        required: ['id', 'children'],
        properties: {
          id: { type: 'string' },
          children: { type: 'array', items: { $dynamicRef: '#category' } },
        },
      }
      const localizedCategory = dyn({
        $id: 'urn:localized',
        $dynamicAnchor: 'category',
        allOf: [
          baseCategory,
          {
            type: 'object',
            required: ['displayName', 'locale'],
            properties: { displayName: { type: 'string' }, locale: { type: 'string' } },
          },
        ],
      })

      const example = getExampleFromSchema(localizedCategory) as {
        id: unknown
        displayName: unknown
        children: Record<string, unknown>[]
      }

      // The top level carries both the base and the localized fields.
      expect(example).toHaveProperty('id')
      expect(example).toHaveProperty('displayName')
      // children bind to the localized type (it has displayName/locale), not the bare base type.
      expect(Array.isArray(example.children)).toBe(true)
      expect(example.children[0]).toHaveProperty('displayName')
      expect(example.children[0]).toHaveProperty('locale')
      // The recursive child is the full bound type, so it keeps the base fields (id, children) too —
      // re-entering the same anchor must not be blocked by the cycle guard from the outer walk.
      expect(example.children[0]).toHaveProperty('id')
      expect(example.children[0]).toHaveProperty('children')
      // The recursion descends at least one level deeper, still carrying the localized fields.
      const grandchildren = example.children[0]!.children as Record<string, unknown>[]
      expect(Array.isArray(grandchildren)).toBe(true)
      expect(grandchildren[0]).toHaveProperty('displayName')
    })

    it('resolves a recursive $dynamicRef behind an object property', () => {
      // Same recursion as above, but the self-reference is a plain object property (a linked-list `next`)
      // rather than array items, so it exercises the main resolver branch instead of the array path.
      const baseNode = {
        $id: 'urn:node-base',
        $dynamicAnchor: 'node',
        type: 'object',
        required: ['value', 'next'],
        properties: {
          value: { type: 'string' },
          next: { $dynamicRef: '#node' },
        },
      }
      const timestampedNode = dyn({
        $id: 'urn:node-timestamped',
        $dynamicAnchor: 'node',
        allOf: [baseNode, { type: 'object', required: ['createdAt'], properties: { createdAt: { type: 'string' } } }],
      })

      const example = getExampleFromSchema(timestampedNode) as {
        value: unknown
        createdAt: unknown
        next: Record<string, unknown>
      }

      expect(example).toHaveProperty('value')
      expect(example).toHaveProperty('createdAt')
      // `next` binds to the timestamped type, so it keeps both the base and the extended fields.
      expect(example.next).toHaveProperty('value')
      expect(example.next).toHaveProperty('createdAt')
      expect(example.next).toHaveProperty('next')
    })
  })
})
