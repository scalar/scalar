import { describe, expect, it } from 'vitest'

import { optimizeValueForDisplay } from './optimizeValueForDisplay'

describe('optimizeValueForDisplay', () => {
  it('should return the original value if it is not an object', () => {
    // @ts-expect-error
    expect(optimizeValueForDisplay(1)).toEqual(1)
  })

  it('should return the original value if there is no discriminator type', () => {
    const input = { type: 'string' }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should return the original value if discriminator schemas is not an array', () => {
    const input = { oneOf: 'not an array' }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should ignore the not discriminator type', () => {
    const input = { not: [{ type: 'string' }] }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should mark as nullable if schema contains null type', () => {
    const input = {
      oneOf: [{ type: 'string' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      nullable: true,
    })
  })

  it('should remove null types from schemas', () => {
    const input = {
      anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'number' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should merge single remaining schema after null removal', () => {
    const input = {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      format: 'date-time',
      nullable: true,
    })
  })

  it('should handle multiple remaining schemas', () => {
    const input = {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should preserve other properties when optimizing', () => {
    const input = {
      description: 'test field',
      oneOf: [{ type: 'string' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      description: 'test field',
      type: 'string',
      nullable: true,
    })
  })

  it('should handle allOf discriminator', () => {
    const input = {
      allOf: [{ type: 'string' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      nullable: true,
    })
  })

  it('preserves schema properties when merging allOf schemas', () => {
    const input = {
      oneOf: [
        {
          title: 'Planet',
          allOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { description: { type: 'string' } } },
          ],
        },
        {
          title: 'Satellite',
          allOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { description: { type: 'string' } } },
          ],
        },
      ],
    }

    const result = optimizeValueForDisplay(input)

    expect(result?.oneOf[0].title).toBe('Planet')
    expect(result?.oneOf[1].title).toBe('Satellite')
  })
})
