import { describe, expect, it } from 'vitest'

import type { SchemaObject } from './schema'
import { isArraySchema, isNumberSchema, isObjectSchema, isStringSchema } from './type-guards'

describe('type-guards', () => {
  describe('isObjectSchema', () => {
    it('returns true for schema with type object', () => {
      const schema = { type: 'object' } as SchemaObject
      expect(isObjectSchema(schema)).toBe(true)
    })

    it('returns true for schema with type array containing object', () => {
      const schema = { type: ['object', 'string'] } as SchemaObject
      expect(isObjectSchema(schema)).toBe(true)
    })

    it('returns false for schema with different type', () => {
      const schema = { type: 'string' } as SchemaObject
      expect(isObjectSchema(schema)).toBe(false)
    })

    it('returns false for schema with type array not containing object', () => {
      const schema = { type: ['string', 'number'] } as SchemaObject
      expect(isObjectSchema(schema)).toBe(false)
    })
  })

  describe('isArraySchema', () => {
    it('returns true for schema with type array', () => {
      const schema = { type: 'array' } as SchemaObject
      expect(isArraySchema(schema)).toBe(true)
    })

    it('returns true for schema with type array containing array', () => {
      const schema = { type: ['array', 'string'] } as SchemaObject
      expect(isArraySchema(schema)).toBe(true)
    })

    it('returns false for schema with different type', () => {
      const schema = { type: 'object' } as SchemaObject
      expect(isArraySchema(schema)).toBe(false)
    })

    it('returns false for schema with type array not containing array', () => {
      const schema = { type: ['string', 'number'] } as SchemaObject
      expect(isArraySchema(schema)).toBe(false)
    })
  })

  describe('isStringSchema', () => {
    it('returns true for schema with type string', () => {
      const schema = { type: 'string' } as SchemaObject
      expect(isStringSchema(schema)).toBe(true)
    })

    it('returns true for schema with type array containing string', () => {
      const schema = { type: ['string', 'number'] } as SchemaObject
      expect(isStringSchema(schema)).toBe(true)
    })

    it('returns false for schema with different type', () => {
      const schema = { type: 'object' } as SchemaObject
      expect(isStringSchema(schema)).toBe(false)
    })

    it('returns false for schema with type array not containing string', () => {
      const schema = { type: ['number', 'boolean'] } as SchemaObject
      expect(isStringSchema(schema)).toBe(false)
    })
  })

  describe('isNumberSchema', () => {
    it('returns true for schema with type number', () => {
      const schema = { type: 'number' } as SchemaObject
      expect(isNumberSchema(schema)).toBe(true)
    })

    it('returns true for schema with type integer', () => {
      const schema = { type: 'integer' } as SchemaObject
      expect(isNumberSchema(schema)).toBe(true)
    })

    it('returns true for schema with type array containing number', () => {
      const schema = { type: ['number', 'string'] } as SchemaObject
      expect(isNumberSchema(schema)).toBe(true)
    })

    it('returns true for schema with type array containing integer', () => {
      const schema = { type: ['integer', 'string'] } as SchemaObject
      expect(isNumberSchema(schema)).toBe(true)
    })

    it('returns false for schema with different type', () => {
      const schema = { type: 'object' } as SchemaObject
      expect(isNumberSchema(schema)).toBe(false)
    })

    it('returns false for schema with type array not containing number or integer', () => {
      const schema = { type: ['string', 'boolean'] } as SchemaObject
      expect(isNumberSchema(schema)).toBe(false)
    })
  })
})
