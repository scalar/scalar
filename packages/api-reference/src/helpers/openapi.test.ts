import type { OperationObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import {
  deepMerge,
  extractBodyDescriptions,
  extractBodyFieldNames,
  extractParameterDescriptions,
  extractParameterNames,
  extractSchemaDescriptions,
  extractSchemaFieldNames,
} from './openapi'

describe('openapi', () => {
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
