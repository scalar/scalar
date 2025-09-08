import { describe, expect, it } from 'vitest'

import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getExampleFromSchema } from './get-example-from-schema'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

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

    function isEmail(text: string) {
      return !!text.match(/^.+@.+\..+$/)
    }

    expect(isEmail(result)).toBe(true)
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
        }),
      ).toMatchObject({
        'propertyName*': 'anything',
      })

      expect(
        getExampleFromSchema(
          coerceValue(SchemaObjectSchema, {
            type: 'object',
            additionalProperties: true,
          }),
        ),
      ).toMatchObject({
        'propertyName*': 'anything',
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
        'propertyName*': 1,
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
        'propertyName*': true,
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
        'propertyName*': false,
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
        'propertyName*': '',
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
        'propertyName*': {
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
        'customField*': '',
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
        'sensorId*': 1,
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
        'isActive*': true,
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
        'metadata*': {
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
        'dynamicField*': null,
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
        'flexibleProperty*': null,
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
        'trimmedField*': '',
      })
    })

    it('falls back to propertyName* when x-additionalPropertiesName is empty string', () => {
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
        'propertyName*': '',
      })
    })

    it('falls back to propertyName* when x-additionalPropertiesName is only whitespace', () => {
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
        'propertyName*': '',
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
        'propertyName*': '',
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
        'propertyName*': '',
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
        'propertyName*': '',
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
        'field-name*': '',
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
        'field_name*': '',
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
        'fieldName*': '',
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
          'setting*': '',
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
        'tag*': '',
      })

      expect(getExampleFromSchema(schema2)).toMatchObject({
        'score*': 1,
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
    it('deals with circular references', () => {
      const schema = {
        type: 'object',
        properties: {
          foobar: {},
        },
      } satisfies OpenAPIV3_1.SchemaObject

      // Create a circular reference
      schema.properties!.foobar = schema

      // 10 levels deep, that's enough. It should hit the max depth limit and return '[Max Depth Exceeded]'
      expect(getExampleFromSchema(schema)).toStrictEqual({
        foobar: {
          foobar: {
            foobar: {
              foobar: {
                foobar: {
                  foobar: {
                    foobar: {
                      foobar: {
                        foobar: {
                          foobar: {
                            foobar: '[Max Depth Exceeded]',
                          },
                        },
                      },
                    },
                  },
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
      } satisfies OpenAPIV3_1.SchemaObject

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

      const example = getExampleFromSchema(schema)
      expect(example).toBeInstanceOf(Object)
      expect(Object.keys(example).length).toBe(26)
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
})
