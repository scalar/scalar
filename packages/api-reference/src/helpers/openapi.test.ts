import type { OperationObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import {
  createSearchFieldExtractor,
  deepMerge,
  extractBodyDescriptions,
  extractBodyFieldNames,
  extractParameterDescriptions,
  extractParameterNames,
  extractSchemaDescriptions,
  extractSchemaFieldNames,
} from './openapi'

describe('openapi', () => {
  it.each([true, false, null, undefined, 0, 1, '', 'string'])('tolerates a non-object schema: %j', (value) => {
    // Exercise unnormalized runtime input outside the workspace store's strict schema type.
    const schema = value as unknown as SchemaObject
    const extract = createSearchFieldExtractor()
    expect(extract.schema(schema)).toStrictEqual({ names: [], descriptions: [] })
    expect(extract.body({ requestBody: { content: { 'application/json': { schema } } } })).toStrictEqual({
      names: [],
      descriptions: [],
    })
  })

  it('collects both search fields with the same composition, reference, cycle and depth ordering', () => {
    const shared: SchemaObject = {
      type: 'object',
      properties: { shared: { type: 'string', description: 'Shared field' } },
    }
    const schema: SchemaObject = {
      type: 'object',
      oneOf: [shared],
      anyOf: [{ type: 'object', properties: { alternate: { type: 'string', description: 'Alternate field' } } }],
      allOf: [{ $ref: '#/components/schemas/Shared', '$ref-value': shared }],
      properties: {
        nested: {
          type: 'object',
          description: 'Nested object',
          properties: {
            child: { type: 'object', properties: { tooDeep: { type: 'string' } }, description: 'Child field' },
          },
        },
        duplicate: { type: 'string', description: 'Shared field' },
        unresolved: { $ref: '#/components/schemas/Missing' },
        '': { type: 'string', description: '' },
      },
    }
    schema.allOf?.push(schema)

    const fields = createSearchFieldExtractor().schema(schema)
    expect(fields).toStrictEqual({
      names: ['nested', 'duplicate', 'unresolved', 'shared', 'alternate', 'child', 'tooDeep'],
      descriptions: ['Nested object', 'Shared field', 'Alternate field', 'Child field'],
    })
    expect(fields).toStrictEqual({
      names: extractSchemaFieldNames(schema),
      descriptions: extractSchemaDescriptions(schema),
    })
  })

  it('preserves the shared visited set across request body media types', () => {
    const shared: SchemaObject = {
      type: 'object',
      properties: {
        child: { type: 'object', properties: { deeper: { type: 'string' } }, description: 'Child field' },
      },
    }
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': { schema: { type: 'object', properties: { nested: shared } } },
          'application/xml': { schema: shared },
        },
      },
    }
    const extract = createSearchFieldExtractor()
    // Priming a root cache must not change the depth at which the second media type is visited.
    expect(extract.schema(shared).names).toStrictEqual(['child', 'deeper'])
    expect(extract.body(operation)).toStrictEqual({
      names: ['nested', 'child', 'deeper'],
      descriptions: ['Child field'],
    })
    expect(extract.body(operation)).toStrictEqual({
      names: extractBodyFieldNames(operation),
      descriptions: extractBodyDescriptions(operation),
    })
  })

  it('expands each schema once when many paths lead to it', () => {
    // Models that reference each other, like entities with navigation properties. Counting reads
    // keeps this deterministic, because proxied reads are what cost time in the browser.
    const expansions = new Map<SchemaObject, number>()
    const models: SchemaObject[] = Array.from({ length: 30 }, () => {
      const model: SchemaObject = {
        type: 'object',
        // The traversal reads `oneOf` exactly once per expansion.
        get oneOf() {
          expansions.set(model, (expansions.get(model) ?? 0) + 1)
          return undefined
        },
      }
      return model
    })
    models.forEach((model, index) => {
      Object.assign(model, {
        properties: Object.fromEntries([
          [`field${index}`, { type: 'string' }],
          ...[1, 7, 13, 19].map((offset) => {
            const target = (index + offset) % models.length
            return [`to${target}`, { $ref: `#/${target}`, '$ref-value': models[target] }]
          }),
        ]),
      })
    })

    const { names } = createSearchFieldExtractor().schema(models[0])

    expect(names).toEqual(expect.arrayContaining(['field0', 'field1', 'field7']))
    expect(Math.max(...expansions.values())).toBe(1)
  })

  it('walks a schema once when many operations reference it', () => {
    let expansions = 0
    const shared: SchemaObject = {
      type: 'object',
      properties: { sharedField: { type: 'string', description: 'Shared description' } },
      // The traversal reads `oneOf` exactly once per expansion.
      get oneOf() {
        expansions++
        return undefined
      },
    }
    // Every operation has its own reference object, so only the resolved schema can identify the work.
    const operation = (): OperationObject => ({
      responses: {
        '200': {
          description: 'OK',
          content: { 'application/json': { schema: { $ref: '#/shared', '$ref-value': shared } } },
        },
      },
    })
    const extract = createSearchFieldExtractor(true)

    const results = [extract.operation(operation()), extract.operation(operation()), extract.schema(shared)]

    for (const fields of results) {
      expect(fields).toStrictEqual({ names: ['sharedField'], descriptions: ['Shared description'] })
    }
    expect(expansions).toBe(1)
  })

  it('does not share reference siblings with the schema they reference', () => {
    const shared: SchemaObject = { type: 'object', properties: { sharedField: { type: 'string' } } }
    const withSibling = {
      $ref: '#/shared',
      '$ref-value': shared,
      properties: { siblingField: { type: 'string' } },
    } as unknown as SchemaObject

    const extract = createSearchFieldExtractor(true)
    expect(extract.schema(shared).names).toStrictEqual(['sharedField'])
    expect(extract.schema(withSibling).names).toEqual(expect.arrayContaining(['sharedField', 'siblingField']))
    expect(extract.schema(shared).names).toStrictEqual(['sharedField'])

    // OpenAPI 3.0 ignores siblings, so the same object is just a reference there.
    expect(createSearchFieldExtractor(false).schema(withSibling).names).toStrictEqual(['sharedField'])
  })

  it('applies the character budget across the schemas of one operation', () => {
    const verbose = (prefix: string): SchemaObject => ({
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length: 40 }, (_, index) => [
          `${prefix}${index}`,
          { type: 'string', description: `${prefix}${index}${'x'.repeat(2_000)}` },
        ]),
      ),
    })
    const response = (schema: SchemaObject): OperationObject['responses'] => ({
      '200': { description: 'OK', content: { 'application/json': { schema } } },
    })
    const fields = createSearchFieldExtractor().operation({
      requestBody: { content: { 'application/json': { schema: verbose('request') } } },
      responses: response(verbose('response')),
    })

    const characters = [...fields.names, ...fields.descriptions].reduce((sum, value) => sum + value.length, 0)
    expect(characters).toBe(100_000)
    expect(fields.names).toContain('request0')
  })

  it('indexes fields two references away from a model but not the whole model graph', () => {
    const reference = (schema: SchemaObject): SchemaObject =>
      ({ $ref: '#/schema', '$ref-value': schema }) as unknown as SchemaObject
    const tooFar: SchemaObject = { type: 'object', properties: { tooFarField: { type: 'string' } } }
    const distant: SchemaObject = {
      type: 'object',
      properties: { distantField: { type: 'string' }, tooFar: reference(tooFar) },
    }
    const related: SchemaObject = {
      type: 'object',
      properties: { relatedField: { type: 'string' }, distant: reference(distant) },
    }
    const entity: SchemaObject = {
      type: 'object',
      properties: { entityField: { type: 'string' }, related: reference(related) },
    }
    const dto: SchemaObject = { type: 'object', properties: { data: reference(entity) } }

    const { names } = createSearchFieldExtractor().schema(reference(dto))

    expect(names).toEqual(expect.arrayContaining(['entityField', 'relatedField', 'distantField', 'tooFar']))
    expect(names).not.toContain('tooFarField')
  })

  it('reads schema edits in a subsequent extraction build', () => {
    const schema: SchemaObject = { type: 'object', properties: { before: { type: 'string', description: 'Old' } } }
    const operation: OperationObject = { requestBody: { content: { 'application/json': { schema } } } }
    expect(createSearchFieldExtractor().body(operation)).toStrictEqual({ names: ['before'], descriptions: ['Old'] })
    schema.properties = { after: { type: 'string', description: 'New' } }
    expect(createSearchFieldExtractor().body(operation)).toStrictEqual({ names: ['after'], descriptions: ['New'] })
  })

  describe('deepMerge', () => {
    it('merges objects', () => {
      expect(
        deepMerge(
          {
            foo: 'bar',
          },
          {
            bar: 'foo',
          },
        ),
      ).toMatchObject({
        foo: 'bar',
        bar: 'foo',
      })
    })

    it('merges objects in objects', () => {
      expect(
        deepMerge(
          {
            foo: 'bar',
            nested: {
              foo: 'bar',
            },
          },
          {
            bar: 'foo',
            nested: {
              foo: 'bar',
              bar: 'foo',
            },
          },
        ),
      ).toMatchObject({
        foo: 'bar',
        bar: 'foo',
        nested: {
          foo: 'bar',
          bar: 'foo',
        },
      })
    })

    it('does not pollute Object.prototype through a __proto__ key', () => {
      // `JSON.parse` creates a real own `__proto__` property, unlike an object literal
      const source = JSON.parse('{"info":{"title":"Test"},"__proto__":{"polluted":"yes"}}')

      const result = deepMerge(source, { openapi: '3.1.0', info: { title: '' } })

      expect(({} as Record<string, unknown>).polluted).toBeUndefined()
      expect(Object.prototype).not.toHaveProperty('polluted')
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
      expect(result).toMatchObject({ openapi: '3.1.0', info: { title: 'Test' } })
    })

    it('keeps a constructor key as plain data without polluting the prototype', () => {
      const source = JSON.parse('{"constructor":{"prototype":{"polluted":"yes"}}}')

      const result = deepMerge(source, {})

      // The malicious payload cannot reach the real prototype chain
      expect(({} as Record<string, unknown>).polluted).toBeUndefined()
      expect(Object.prototype).not.toHaveProperty('polluted')
      // But a document is still free to describe a property literally named `constructor`
      expect(Object.hasOwn(result, 'constructor')).toBe(true)
      expect(result.constructor.prototype.polluted).toBe('yes')
    })

    it('keeps a schema property named prototype', () => {
      const source = JSON.parse('{"components":{"schemas":{"Foo":{"properties":{"prototype":{"type":"string"}}}}}}')

      const result = deepMerge(source, {})

      expect(result.components.schemas.Foo.properties.prototype).toEqual({ type: 'string' })
    })

    it('merges objects with a null prototype', () => {
      const source = { nested: Object.assign(Object.create(null), { foo: 'bar' }) }

      expect(deepMerge(source, {})).toMatchObject({ nested: { foo: 'bar' } })
    })

    it('does not merge undefined properties', () => {
      expect(
        deepMerge(
          {
            bar: undefined,
          },
          {
            foo: 'bar',
            bar: 'foo',
          },
        ),
      ).toMatchObject({
        foo: 'bar',
        bar: 'foo',
      })
    })
  })

  describe('extractParameterNames', () => {
    it('returns empty array for empty parameters', () => {
      expect(extractParameterNames([])).toEqual([])
    })

    it('returns just the name for a path parameter', () => {
      expect(extractParameterNames([{ in: 'path', name: 'userId', required: true }])).toEqual(['userId'])
    })

    it('returns just the name for a query parameter', () => {
      expect(extractParameterNames([{ in: 'query', name: 'limit', schema: { type: 'integer' } }])).toEqual(['limit'])
    })

    it('drops filter-style metadata tokens', () => {
      const result = extractParameterNames([
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' },
          description: 'Unique user identifier',
        },
      ])
      expect(result).toEqual(['userId'])
      expect(result.join(' ')).not.toContain('REQUIRED')
      expect(result.join(' ')).not.toContain('path')
      expect(result.join(' ')).not.toContain('string')
    })

    it('extracts names across all parameter locations', () => {
      const result = extractParameterNames([
        { in: 'path', name: 'id', required: true },
        { in: 'query', name: 'filter' },
        { in: 'header', name: 'X-Api-Key', required: true },
        { in: 'cookie', name: 'session' },
      ])
      expect(result).toEqual(['id', 'filter', 'X-Api-Key', 'session'])
    })

    it('deduplicates repeated names', () => {
      const result = extractParameterNames([
        { in: 'query', name: 'tag' },
        { in: 'query', name: 'tag' },
      ])
      expect(result).toEqual(['tag'])
    })
  })

  describe('extractParameterDescriptions', () => {
    it('returns empty array when no descriptions are present', () => {
      expect(extractParameterDescriptions([{ in: 'query', name: 'limit' }])).toEqual([])
    })

    it('returns the descriptions in order', () => {
      const result = extractParameterDescriptions([
        { in: 'query', name: 'limit', description: 'Maximum number of results' },
        { in: 'path', name: 'userId', required: true, description: 'Unique user identifier' },
      ])
      expect(result).toEqual(['Maximum number of results', 'Unique user identifier'])
    })

    it('skips parameters without a description', () => {
      const result = extractParameterDescriptions([
        { in: 'query', name: 'limit' },
        { in: 'query', name: 'offset', description: 'Number of records to skip' },
      ])
      expect(result).toEqual(['Number of records to skip'])
    })
  })

  describe('extractBodyFieldNames', () => {
    it('returns empty array for an operation without requestBody', () => {
      const operation: OperationObject = {
        summary: 'Test',
        responses: { 200: { description: 'OK' } },
      }
      expect(extractBodyFieldNames(operation)).toEqual([])
    })

    it('returns empty array for empty requestBody content', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: { content: {} },
      }
      expect(extractBodyFieldNames(operation)).toEqual([])
    })

    it('extracts top-level property names from application/json', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual(['name', 'email'])
    })

    it('extracts names across multiple content types and deduplicates', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonField: { type: 'string' },
                  shared: { type: 'string' },
                },
              },
            },
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  xmlField: { type: 'number' },
                  shared: { type: 'number' },
                },
              },
            },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual(['jsonField', 'shared', 'xmlField'])
    })

    it('extracts names from one level of nested objects', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  address: {
                    type: 'object',
                    properties: {
                      street: { type: 'string' },
                      city: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual(['address', 'street', 'city'])
    })

    it('returns empty array for non-object schemas (e.g. text/plain)', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'text/plain': { schema: { type: 'string' } },
          },
        },
      }
      expect(extractBodyFieldNames(operation)).toEqual([])
    })

    it('does not include filter-style metadata tokens', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  age: { type: 'number' },
                },
              },
            },
          },
        },
      }
      const result = extractBodyFieldNames(operation)
      expect(result).toEqual(['name', 'age'])
      expect(result.join(' ')).not.toContain('REQUIRED')
      expect(result.join(' ')).not.toContain('optional')
      expect(result.join(' ')).not.toContain('string')
    })

    it('collects properties from every branch of a oneOf', () => {
      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    type: 'object',
                    properties: {
                      planetName: { type: 'string' },
                      failureCallbackUrl: { type: 'string' },
                    },
                  },
                  {
                    type: 'object',
                    properties: {
                      satelliteName: { type: 'string' },
                      orbitalPeriod: { type: 'number' },
                    },
                  },
                ],
              },
            },
          },
        },
      } as unknown as OperationObject

      expect(extractBodyFieldNames(operation)).toEqual([
        'planetName',
        'failureCallbackUrl',
        'satelliteName',
        'orbitalPeriod',
      ])
    })

    it('resolves $ref schemas inside a oneOf', () => {
      // Mirrors the Galaxy spec's CelestialBody shape: a oneOf of two $ref-ed object schemas.
      const planetSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          failureCallbackUrl: { type: 'string' },
        },
      } as unknown as SchemaObject
      const satelliteSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          orbitalPeriod: { type: 'number' },
        },
      } as unknown as SchemaObject
      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/Planet', '$ref-value': planetSchema },
                  { $ref: '#/components/schemas/Satellite', '$ref-value': satelliteSchema },
                ],
              },
            },
          },
        },
      } as unknown as OperationObject

      expect(extractBodyFieldNames(operation)).toEqual(['name', 'failureCallbackUrl', 'orbitalPeriod'])
    })

    it('collects properties from every branch of an anyOf', () => {
      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                anyOf: [
                  {
                    type: 'object',
                    properties: { emailAddress: { type: 'string' } },
                  },
                  {
                    type: 'object',
                    properties: { phoneNumber: { type: 'string' } },
                  },
                ],
              },
            },
          },
        },
      } as unknown as OperationObject

      expect(extractBodyFieldNames(operation)).toEqual(['emailAddress', 'phoneNumber'])
    })

    it('collects properties from every member of an allOf', () => {
      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    type: 'object',
                    properties: { id: { type: 'string' } },
                  },
                  {
                    type: 'object',
                    properties: { createdAt: { type: 'string' } },
                  },
                ],
              },
            },
          },
        },
      } as unknown as OperationObject

      expect(extractBodyFieldNames(operation)).toEqual(['id', 'createdAt'])
    })

    it('descends through composition nested inside a property', () => {
      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payload: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          textValue: { type: 'string' },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          numberValue: { type: 'number' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      } as unknown as OperationObject

      expect(extractBodyFieldNames(operation)).toEqual(['payload', 'textValue', 'numberValue'])
    })

    it('does not loop on a recursive schema', () => {
      const treeProperties: Record<string, unknown> = {
        value: { type: 'string' },
      }
      const treeSchema = {
        type: 'object',
        properties: treeProperties,
      } as unknown as SchemaObject
      // Wire up the recursive child after creation so both refer to the same object.
      treeProperties.child = {
        $ref: '#/components/schemas/Tree',
        '$ref-value': treeSchema,
      }

      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': { schema: treeSchema },
          },
        },
      } as unknown as OperationObject

      // Should terminate and emit each unique property name exactly once.
      expect(extractBodyFieldNames(operation)).toEqual(['value', 'child'])
    })
  })

  describe('extractBodyDescriptions', () => {
    it('returns empty array when no property has a description', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
      }
      expect(extractBodyDescriptions(operation)).toEqual([])
    })

    it('extracts top-level property descriptions', () => {
      const operation: OperationObject = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'User display name' },
                  email: { type: 'string', description: 'User email address' },
                },
              },
            },
          },
        },
      }
      expect(extractBodyDescriptions(operation)).toEqual(['User display name', 'User email address'])
    })

    it('extracts descriptions from oneOf branches', () => {
      const operation = {
        summary: 'Test',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Planet name' },
                    },
                  },
                  {
                    type: 'object',
                    properties: {
                      orbit: { type: 'number', description: 'Orbital period in days' },
                    },
                  },
                ],
              },
            },
          },
        },
      } as unknown as OperationObject

      expect(extractBodyDescriptions(operation)).toEqual(['Planet name', 'Orbital period in days'])
    })
  })

  describe('extractSchemaFieldNames', () => {
    it('returns empty array for an undefined schema', () => {
      expect(extractSchemaFieldNames(undefined)).toEqual([])
    })

    it('extracts top-level property names from an object schema', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          diameter: { type: 'number' },
        },
      } as unknown as SchemaObject

      expect(extractSchemaFieldNames(schema)).toEqual(['id', 'name', 'diameter'])
    })

    it('descends through a oneOf of $ref schemas', () => {
      const planet = {
        type: 'object',
        properties: { name: { type: 'string' }, failureCallbackUrl: { type: 'string' } },
      } as unknown as SchemaObject
      const satellite = {
        type: 'object',
        properties: { name: { type: 'string' }, diameter: { type: 'number' } },
      } as unknown as SchemaObject
      const schema = {
        oneOf: [
          { $ref: '#/components/schemas/Planet', '$ref-value': planet },
          { $ref: '#/components/schemas/Satellite', '$ref-value': satellite },
        ],
      } as unknown as SchemaObject

      expect(extractSchemaFieldNames(schema)).toEqual(['name', 'failureCallbackUrl', 'diameter'])
    })
  })

  describe('extractSchemaDescriptions', () => {
    it('returns empty array for an undefined schema', () => {
      expect(extractSchemaDescriptions(undefined)).toEqual([])
    })

    it('extracts top-level property descriptions', () => {
      const schema = {
        type: 'object',
        properties: {
          diameter: { type: 'number', description: 'Diameter in kilometers' },
          name: { type: 'string' },
        },
      } as unknown as SchemaObject

      expect(extractSchemaDescriptions(schema)).toEqual(['Diameter in kilometers'])
    })
  })
})
