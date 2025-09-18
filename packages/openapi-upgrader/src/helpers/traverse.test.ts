import { describe, expect, it } from 'vitest'

import { traverse } from './traverse'

describe('traverse', () => {
  it('applies transform function to a flat object', () => {
    const definition = { a: 1, b: 2 }
    const transform = (schema: any) => {
      return Object.fromEntries(
        Object.entries(schema).map(([key, value]) => {
          if (typeof value !== 'number') {
            return [key, value]
          }

          return [key, value * 2]
        }),
      )
    }

    const result = traverse(definition, transform)
    expect(result).toEqual({ a: 2, b: 4 })
  })

  it('applies transform function to nested objects', () => {
    const definition = { a: { b: 2, c: 3 }, d: 4 }
    const transform = (schema: any) => {
      return Object.fromEntries(
        Object.entries(schema).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return [key, value]
          }

          if (typeof value !== 'number') {
            return [key, value]
          }

          return [key, value * 2]
        }),
      )
    }
    const result = traverse(definition, transform)
    expect(result).toEqual({ a: { b: 4, c: 6 }, d: 8 })
  })

  it('applies transform function to arrays within objects', () => {
    const definition = { a: [1, 2, { b: 3 }], c: 4 }
    const transform = (schema: any) => {
      return Object.fromEntries(
        Object.entries(schema).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [key, value.map((v: any) => (typeof v === 'number' ? v * 2 : v))]
          }

          if (typeof value !== 'number') {
            return [key, value]
          }

          return [key, value * 2]
        }),
      )
    }

    const result = traverse(definition, transform)

    expect(result).toEqual({ a: [2, 4, { b: 6 }], c: 8 })
  })

  it('handles empty objects', () => {
    const definition = {}
    const transform = (schema: any) => schema
    const result = traverse(definition, transform)

    expect(result).toEqual({})
  })

  it('handles objects with null values', () => {
    const definition = { a: null, b: 2 }
    const transform = (schema: any) => schema
    const result = traverse(definition, transform)

    expect(result).toEqual({ a: null, b: 2 })
  })

  it('handles circular references', () => {
    const definition: { a: number; b?: unknown; c: number } = { a: 2, c: 3 }
    definition.b = definition

    const transform = (schema: any) => {
      return Object.fromEntries(
        Object.entries(schema).filter(([, value]) => {
          if (typeof value !== 'number') {
            return true
          }

          return value % 2 === 0
        }),
      )
    }

    const result = traverse(definition, transform)

    expect(result).toMatchObject({ a: 2, b: { a: 2, b: { a: 2 } } })
  })

  it('handles circular references with arrays', () => {
    const definition: { a: number; b?: unknown; c: number[] } = { a: 8, c: [4, 1, 8] }
    definition.b = definition

    const transform = (schema: any) => {
      return Object.fromEntries(
        Object.entries(schema).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [key, value.sort()]
          }

          if (typeof value !== 'number') {
            return [key, value]
          }

          return [key, value ** 2]
        }),
      )
    }

    const result = traverse(definition, transform)

    expect(result).toMatchObject({ a: 64, c: [1, 4, 8], b: { a: 64, c: [1, 4, 8] } })
  })
})
