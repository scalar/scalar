import { describe, expect, it } from 'vitest'

import { inferSchemaFromExample, inferSchemaType } from './schemas'

describe('schemas', () => {
  describe('inferSchemaFromExample', () => {
    it('infers object schema from object example', () => {
      const example = {
        id: 1,
        name: 'John',
        active: true,
      }

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          name: {
            type: 'string',
          },
          active: {
            type: 'boolean',
          },
        },
      })
    })

    it('infers array schema from array example', () => {
      const example = [1, 2, 3]

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'number',
        },
      })
    })

    it('infers array schema with object items', () => {
      const example = [
        {
          id: 1,
          name: 'John',
        },
        {
          id: 2,
          name: 'Jane',
        },
      ]

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
            },
            name: {
              type: 'string',
            },
          },
        },
      })
    })

    it('infers empty object schema for empty array', () => {
      const example: unknown[] = []

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'array',
        items: {},
      })
    })

    it('infers nested object schema', () => {
      const example = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            email: 'john@example.com',
          },
        },
      }

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
              },
              profile: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  email: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      })
    })

    it('infers string schema from string value', () => {
      const example = 'hello'

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'string',
      })
    })

    it('infers number schema from number value', () => {
      const example = 42

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'number',
      })
    })

    it('infers boolean schema from boolean value', () => {
      const example = true

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'boolean',
      })
    })

    it('handles null value', () => {
      const example = null

      const result = inferSchemaFromExample(example)

      expect(result).toEqual({
        type: 'object',
      })
    })
  })

  describe('inferSchemaType', () => {
    it('infers integer type from integer number', () => {
      const result = inferSchemaType(42)

      expect(result).toEqual({
        type: 'integer',
      })
    })

    it('infers number type from float number', () => {
      const result = inferSchemaType(3.14)

      expect(result).toEqual({
        type: 'number',
      })
    })

    it('infers boolean type from boolean value', () => {
      const result = inferSchemaType(true)

      expect(result).toEqual({
        type: 'boolean',
      })
    })

    it('infers number type from numeric string', () => {
      const result = inferSchemaType('42')

      expect(result).toEqual({
        type: 'integer',
      })
    })

    it('infers number type from float string', () => {
      const result = inferSchemaType('3.14')

      expect(result).toEqual({
        type: 'number',
      })
    })

    it('infers boolean type from "true" string', () => {
      const result = inferSchemaType('true')

      expect(result).toEqual({
        type: 'boolean',
      })
    })

    it('infers boolean type from "false" string', () => {
      const result = inferSchemaType('false')

      expect(result).toEqual({
        type: 'boolean',
      })
    })

    it('infers boolean type from "TRUE" string', () => {
      const result = inferSchemaType('TRUE')

      expect(result).toEqual({
        type: 'boolean',
      })
    })

    it('infers boolean type from "FALSE" string', () => {
      const result = inferSchemaType('FALSE')

      expect(result).toEqual({
        type: 'boolean',
      })
    })

    it('infers string type from non-numeric string', () => {
      const result = inferSchemaType('hello')

      expect(result).toEqual({
        type: 'string',
      })
    })

    it('infers integer type from empty string (parsed as 0)', () => {
      const result = inferSchemaType('')

      expect(result).toEqual({
        type: 'integer',
      })
    })

    it('infers string type when value is undefined', () => {
      const result = inferSchemaType(undefined)

      expect(result).toEqual({
        type: 'string',
      })
    })
  })
})
