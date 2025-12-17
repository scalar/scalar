import { addToMapArray } from '@scalar/helpers/array/add-to-map-array'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'

/**
 * Extract all examples from an object schema to be applied to the properties
 *
 * @example
 * ```yaml
 * type: object
 * properties:
 *   name:
 *     type: string
 *   age:
 *     type: integer
 * x-examples:
 *   Example 1:
 *     name: Marc
 *     age: 99
 * examples:
 *   - name: Cam
 *     age: 98
 *   - name: Hans
 *     age: 97
 * ```
 *
 * returns
 *
 * ```ts
 * {
 *   name: ['Marc', 'Cam', 'Hans'],
 *   age: [99, 98, 97]
 * }
 * ```
 */
export const extractObjectExamples = (schema: SchemaObject): Map<string, unknown[]> | null => {
  if (!isTypeObject(schema) || !schema.properties || (!schema.examples && !schema['x-examples'])) {
    return null
  }

  /** Gather up all example values by property name */
  const examplesByProperty = new Map<string, unknown[]>()

  // Add values from examples
  if (schema.examples) {
    schema.examples.forEach((example) => {
      if (example && typeof example === 'object') {
        objectKeys(example).forEach((key) => addToMapArray(examplesByProperty, key, example[key]))
      }
    })
  }

  // Add values from x-examples
  if (schema['x-examples']) {
    objectKeys(schema['x-examples']).forEach((name) => {
      objectKeys(schema['x-examples']?.[name] ?? {}).forEach((key) =>
        addToMapArray(examplesByProperty, key, schema['x-examples']?.[name]?.[key]),
      )
    })
  }

  return examplesByProperty
}
