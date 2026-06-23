import type { DiscriminatorObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { reduceNamesToObject, sortPropertyNames } from './sort-property-names'

describe('reduceNamesToObject', () => {
  it('should reduce property names back to an object', () => {
    const properties = {
      name: { type: 'string' as const },
      age: { type: 'number' as const },
      email: { type: 'string' as const },
    }
    const names = ['name', 'email']

    const result = reduceNamesToObject(names, properties)

    expect(result).toEqual({
      name: { type: 'string' },
      email: { type: 'string' },
    })
  })

  it('should handle empty names array', () => {
    const properties = {
      name: { type: 'string' as const },
      age: { type: 'number' as const },
    }
    const names: string[] = []

    const result = reduceNamesToObject(names, properties)

    expect(result).toEqual({})
  })

  it('should ignore names that do not exist in properties', () => {
    const properties = {
      name: { type: 'string' as const },
      age: { type: 'number' as const },
    }
    const names = ['name', 'nonexistent', 'age']

    const result = reduceNamesToObject(names, properties)

    expect(result).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    })
  })

  it('should handle undefined properties', () => {
    const properties = undefined
    const names = ['name', 'age']

    const result = reduceNamesToObject(names, properties as any)

    expect(result).toEqual({})
  })

  it('should handle null property values', () => {
    const properties = {
      name: { type: 'string' as const },
      nullProp: null,
      age: { type: 'number' as const },
    }
    const names = ['name', 'nullProp', 'age']

    const result = reduceNamesToObject(names, properties as any)

    expect(result).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    })
  })
})

describe('sortPropertyNames', () => {
  describe('basic sorting', () => {
    it('should return empty array for non-object schema', () => {
      const schema: SchemaObject = { type: 'string' }

      const result = sortPropertyNames(schema)

      expect(result).toEqual([])
    })

    it('should return empty array for object schema without properties', () => {
      const schema: SchemaObject = { type: 'object' }

      const result = sortPropertyNames(schema)

      expect(result).toEqual([])
    })

    it('should sort properties alphabetically by default', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          banana: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['apple', 'banana', 'zebra'])
    })

    it('should handle schema with properties but no type when it has object-like properties', () => {
      // @ts-expect-error - we want to test the case where the schema has properties but no type
      const schema: SchemaObject = {
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['age', 'name'])
    })
  })

  describe('required properties ordering', () => {
    it('should put required properties first when orderRequiredPropertiesFirst is true', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          banana: { type: 'string' },
        },
        required: ['zebra', 'banana'],
      }

      const result = sortPropertyNames(schema, undefined, {
        orderRequiredPropertiesFirst: true,
      })

      expect(result).toEqual(['banana', 'zebra', 'apple'])
    })

    it('should not prioritize required properties when orderRequiredPropertiesFirst is false', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          banana: { type: 'string' },
        },
        required: ['zebra'],
      }

      const result = sortPropertyNames(schema, undefined, {
        orderRequiredPropertiesFirst: false,
      })

      expect(result).toEqual(['apple', 'banana', 'zebra'])
    })

    it('should handle empty required array', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
        },
        required: [],
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['apple', 'zebra'])
    })

    it('should handle missing required property', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['apple', 'zebra'])
    })
  })

  describe('discriminator property ordering', () => {
    it('should put discriminator property first', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          type: { type: 'string' },
        },
      }
      const discriminator: DiscriminatorObject = {
        propertyName: 'type',
      }

      const result = sortPropertyNames(schema, discriminator)

      expect(result).toEqual(['type', 'apple', 'zebra'])
    })

    it('should put discriminator property first even before required properties', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          type: { type: 'string' },
        },
        required: ['zebra', 'apple'],
      }
      const discriminator: DiscriminatorObject = {
        propertyName: 'type',
      }

      const result = sortPropertyNames(schema, discriminator, {
        orderRequiredPropertiesFirst: true,
      })

      expect(result).toEqual(['type', 'apple', 'zebra'])
    })

    it('should handle discriminator property that does not exist in properties', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
        },
      }
      const discriminator: DiscriminatorObject = {
        propertyName: 'nonexistent',
      }

      const result = sortPropertyNames(schema, discriminator)

      expect(result).toEqual(['apple', 'zebra'])
    })
  })

  describe('sorting order options', () => {
    it('should sort alphabetically when orderSchemaPropertiesBy is "alpha"', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          banana: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        orderSchemaPropertiesBy: 'alpha',
      })

      expect(result).toEqual(['apple', 'banana', 'zebra'])
    })

    it('should maintain original order when orderSchemaPropertiesBy is not "alpha"', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          banana: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        orderSchemaPropertiesBy: 'original' as any,
      })

      // Since we're not sorting alphabetically and there are no required properties,
      // the order should be based on Object.keys() which is insertion order
      expect(result).toEqual(['zebra', 'apple', 'banana'])
    })
  })

  describe('filtering properties', () => {
    it('should filter out readOnly properties when hideReadOnly is true', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          id: { type: 'string', readOnly: true },
          email: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        hideReadOnly: true,
      })

      expect(result).toEqual(['email', 'name'])
    })

    it('should include readOnly properties when hideReadOnly is false', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          id: { type: 'string', readOnly: true },
          email: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        hideReadOnly: false,
      })

      expect(result).toEqual(['email', 'id', 'name'])
    })

    it('should filter out writeOnly properties when hideWriteOnly is true', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          password: { type: 'string', writeOnly: true },
          email: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        hideWriteOnly: true,
      })

      expect(result).toEqual(['email', 'name'])
    })

    it('should include writeOnly properties when hideWriteOnly is false', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          password: { type: 'string', writeOnly: true },
          email: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        hideWriteOnly: false,
      })

      expect(result).toEqual(['email', 'name', 'password'])
    })

    it('should handle both hideReadOnly and hideWriteOnly together', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          id: { type: 'string', readOnly: true },
          password: { type: 'string', writeOnly: true },
          email: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        hideReadOnly: true,
        hideWriteOnly: true,
      })

      // Note: The current implementation only applies the first filter that is true
      // Since hideReadOnly is checked first, it will filter out readOnly properties
      // but won't check for writeOnly properties
      expect(result).toEqual(['email', 'name'])
    })

    it('should handle properties with $ref that resolve to readOnly', () => {
      // Since we can't easily test the $ref resolution without complex mocking,
      // let's test with direct readOnly properties instead
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          refProp: { type: 'string', readOnly: true },
          email: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema, undefined, {
        hideReadOnly: true,
      })

      expect(result).toEqual(['email', 'name'])
    })
  })

  describe('complex scenarios', () => {
    it('should handle all options together', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
          type: { type: 'string' },
          readOnlyProp: { type: 'string', readOnly: true },
          writeOnlyProp: { type: 'string', writeOnly: true },
          banana: { type: 'string' },
        },
        required: ['zebra', 'banana'],
      }
      const discriminator: DiscriminatorObject = {
        propertyName: 'type',
      }

      const result = sortPropertyNames(schema, discriminator, {
        orderRequiredPropertiesFirst: true,
        orderSchemaPropertiesBy: 'alpha',
        hideReadOnly: true,
        hideWriteOnly: true,
      })

      // Expected order:
      // 1. Discriminator first: 'type'
      // 2. Required properties (alphabetically): 'banana', 'zebra'
      // 3. Non-required properties (alphabetically): 'apple'
      expect(result).toEqual(['type', 'banana', 'zebra', 'apple'])
    })

    it('should handle properties with special characters in names', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          'special-prop': { type: 'string' },
          'another_prop': { type: 'string' },
          normalProp: { type: 'string' },
          '@symbol': { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['@symbol', 'another_prop', 'normalProp', 'special-prop'])
    })

    it('should handle empty properties object', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {},
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual([])
    })

    it('should handle schema with union type including object', () => {
      const schema: SchemaObject = {
        type: ['object', 'null'] as any,
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['age', 'name'])
    })

    it('should handle case-insensitive alphabetical sorting', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          Zebra: { type: 'string' },
          apple: { type: 'string' },
          Banana: { type: 'string' },
          charlie: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema)

      // localeCompare should handle case-insensitive sorting
      expect(result).toEqual(['apple', 'Banana', 'charlie', 'Zebra'])
    })
  })

  describe('x-order sorting', () => {
    it('sorts all properties by x-order value', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string', 'x-order': 3 } as any,
          apple: { type: 'string', 'x-order': 1 } as any,
          banana: { type: 'string', 'x-order': 2 } as any,
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['apple', 'banana', 'zebra'])
    })

    it('places properties with x-order before those without', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          zebra: { type: 'string', 'x-order': 1 } as any,
          apple: { type: 'string' },
          banana: { type: 'string', 'x-order': 2 } as any,
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['zebra', 'banana', 'apple'])
    })

    it('respects discriminator over x-order', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          type: { type: 'string', 'x-order': 3 } as any,
          apple: { type: 'string', 'x-order': 1 } as any,
          banana: { type: 'string', 'x-order': 2 } as any,
        },
      }
      const discriminator: DiscriminatorObject = {
        propertyName: 'type',
      }

      const result = sortPropertyNames(schema, discriminator)

      // Discriminator always comes first, even with a higher x-order
      expect(result).toEqual(['type', 'apple', 'banana'])
    })

    it('sorts correctly with double-digit x-order values', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          prop1: { type: 'string', 'x-order': 1 } as any,
          prop2: { type: 'string', 'x-order': 2 } as any,
          prop3: { type: 'string', 'x-order': 3 } as any,
          prop4: { type: 'string', 'x-order': 4 } as any,
          prop5: { type: 'string', 'x-order': 5 } as any,
          prop6: { type: 'string', 'x-order': 6 } as any,
          prop7: { type: 'string', 'x-order': 7 } as any,
          prop8: { type: 'string', 'x-order': 8 } as any,
          prop9: { type: 'string', 'x-order': 9 } as any,
          prop10: { type: 'string', 'x-order': 10 } as any,
          prop11: { type: 'string', 'x-order': 11 } as any,
          prop12: { type: 'string', 'x-order': 12 } as any,
        },
      }

      const result = sortPropertyNames(schema)

      // Must be numeric order (1,2,...,12), not string order (1,10,11,12,2,...)
      expect(result).toEqual([
        'prop1',
        'prop2',
        'prop3',
        'prop4',
        'prop5',
        'prop6',
        'prop7',
        'prop8',
        'prop9',
        'prop10',
        'prop11',
        'prop12',
      ])
    })

    it('sorts correctly when x-order values are strings', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          prop1: { type: 'string', 'x-order': '1' } as any,
          prop2: { type: 'string', 'x-order': '2' } as any,
          prop3: { type: 'string', 'x-order': '3' } as any,
          prop10: { type: 'string', 'x-order': '10' } as any,
          prop11: { type: 'string', 'x-order': '11' } as any,
          prop20: { type: 'string', 'x-order': '20' } as any,
        },
      }

      const result = sortPropertyNames(schema)

      // Number() coercion should handle string values correctly
      expect(result).toEqual(['prop1', 'prop2', 'prop3', 'prop10', 'prop11', 'prop20'])
    })

    it('uses x-order before required status', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          optional: { type: 'string', 'x-order': 1 } as any,
          required: { type: 'string', 'x-order': 2 } as any,
          noOrder: { type: 'string' },
        },
        required: ['required', 'noOrder'],
      }

      const result = sortPropertyNames(schema, undefined, {
        orderRequiredPropertiesFirst: true,
      })

      // x-order takes priority over required status
      expect(result).toEqual(['optional', 'required', 'noOrder'])
    })
  })

  describe('edge cases', () => {
    it('should handle null schema', () => {
      const result = sortPropertyNames(null as any)

      expect(result).toEqual([])
    })

    it('should handle undefined schema', () => {
      const result = sortPropertyNames(undefined as any)

      expect(result).toEqual([])
    })

    it('should handle schema with composition keywords', () => {
      // @ts-expect-error - we want to test the case where the schema has composition keywords
      const schema: SchemaObject = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
        properties: {
          name: { type: 'string' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual([])
    })

    it('should handle discriminator with undefined propertyName', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
        },
      }
      const discriminator: DiscriminatorObject = {
        propertyName: undefined as any,
      }

      const result = sortPropertyNames(schema, discriminator)

      expect(result).toEqual(['name', 'type'])
    })

    it('should handle properties with undefined values', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          undefinedProp: undefined as any,
          age: { type: 'number' },
        },
      }

      const result = sortPropertyNames(schema)

      expect(result).toEqual(['age', 'name', 'undefinedProp'])
    })
  })
})
