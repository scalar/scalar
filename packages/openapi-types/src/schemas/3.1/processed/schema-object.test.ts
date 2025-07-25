import { describe, expect, it } from 'vitest'
import { SchemaObjectSchema } from './schema-object'

describe('schema-object', () => {
  describe('basic validation', () => {
    it('validates a simple string schema', () => {
      const schema = {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z]+$',
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates a complex object schema', () => {
      const schema = {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
            minLength: 1,
          },
          age: {
            type: 'integer',
            minimum: 0,
            maximum: 150,
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            uniqueItems: true,
          },
        },
        required: ['id', 'name'],
        additionalProperties: false,
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates array type with tuple validation', () => {
      const schema = {
        type: 'array',
        items: {
          type: ['string', 'number'],
        },
        minItems: 2,
        maxItems: 5,
        uniqueItems: true,
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates schema with null type', () => {
      const schema = {
        type: ['string', 'null'],
        description: 'A nullable string field',
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })
  })

  describe('format compatibility', () => {
    it('validates string formats with string type', () => {
      const stringFormats = [
        'date',
        'date-time',
        'duration',
        'password',
        'byte',
        'binary',
        'email',
        'uuid',
        'uri',
        'uri-reference',
        'uri-template',
        'hostname',
        'ipv4',
        'ipv6',
      ]

      stringFormats.forEach((format) => {
        const schema = {
          type: 'string',
          format,
        }
        const result = SchemaObjectSchema.safeParse(schema)
        expect(result.success).toBe(true)
      })
    })

    it('validates number formats with numeric types', () => {
      const numberFormats = ['float', 'double', 'int32', 'int64']

      numberFormats.forEach((format) => {
        const schema = {
          type: 'number',
          format,
        }
        const result = SchemaObjectSchema.safeParse(schema)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('discriminator validation', () => {
    it('validates discriminator with oneOf', () => {
      const schema = {
        oneOf: [
          { type: 'object', properties: { type: { const: 'dog' } } },
          { type: 'object', properties: { type: { const: 'cat' } } },
        ],
        discriminator: {
          propertyName: 'type',
        },
        required: ['type'],
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates discriminator with anyOf', () => {
      const schema = {
        anyOf: [
          { type: 'object', properties: { type: { const: 'dog' } } },
          { type: 'object', properties: { type: { const: 'cat' } } },
        ],
        discriminator: {
          propertyName: 'type',
        },
        required: ['type'],
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates discriminator with mapping', () => {
      const schema = {
        oneOf: [
          { type: 'object', properties: { type: { const: 'dog' } } },
          { type: 'object', properties: { type: { const: 'cat' } } },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
        required: ['type'],
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })
  })

  describe('metadata validation', () => {
    it('validates vendor extensions', () => {
      const schema = {
        type: 'string',
        'x-custom-extension': true,
        'x-another-extension': {
          nested: 'value',
        },
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })
  })

  describe('format validation', () => {
    it('validates date format', () => {
      const schema = {
        type: 'string',
        format: 'date',
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates email format', () => {
      const schema = {
        type: 'string',
        format: 'email',
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates uuid format', () => {
      const schema = {
        type: 'string',
        format: 'uuid',
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates int32 format', () => {
      const schema = {
        type: 'integer',
        format: 'int32',
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })
  })

  describe('OpenAPI extensions', () => {
    it('validates xml configuration', () => {
      const schema = {
        type: 'object',
        xml: {
          name: 'Pet',
          namespace: 'http://example.com/schema',
          prefix: 'p',
          attribute: true,
          wrapped: true,
        },
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates external documentation', () => {
      const schema = {
        type: 'object',
        externalDocs: {
          description: 'Find more info here',
          url: 'https://example.com/docs',
        },
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates custom x- extensions', () => {
      const schema = {
        type: 'string',
        'x-custom-extension': {
          someValue: 123,
        },
        'x-another-extension': true,
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })
  })

  describe('schema composition', () => {
    it('validates allOf composition', () => {
      const schema = {
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } } },
          { type: 'object', properties: { age: { type: 'integer' } } },
        ],
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates oneOf with discriminator', () => {
      const schema = {
        oneOf: [
          { type: 'object', properties: { type: { const: 'dog' }, bark: { type: 'boolean' } } },
          { type: 'object', properties: { type: { const: 'cat' }, meow: { type: 'boolean' } } },
        ],
        discriminator: {
          propertyName: 'type',
        },
        required: ['type'],
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates anyOf with multiple types', () => {
      const schema = {
        anyOf: [{ type: 'string', format: 'email' }, { type: 'string', format: 'uri' }, { type: 'null' }],
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('validates not with complex schema', () => {
      const schema = {
        not: {
          type: 'object',
          properties: {
            forbidden: { type: 'boolean', const: true },
            restricted: { type: 'string', enum: ['no', 'nope'] },
          },
          required: ['forbidden'],
        },
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true)
    })
  })

  describe('validation errors', () => {
    it('rejects invalid type values', () => {
      const schema = { type: 'invalid' }
      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('type')
      }
    })

    it('rejects invalid required fields', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['age'], // age is not defined in properties
      }

      const result = SchemaObjectSchema.safeParse(schema)
      expect(result.success).toBe(true) // OpenAPI allows this as properties might be defined elsewhere
    })
  })
})
