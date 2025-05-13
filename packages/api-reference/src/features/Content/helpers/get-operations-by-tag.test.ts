import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { createCollection } from '@scalar/store'
import { describe, expect, it } from 'vitest'
import { getOperationsByTag } from './get-operations-by-tag'

const collection = createCollection({
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  tags: [
    {
      name: 'Hello',
      description: 'Hello World',
      operations: [],
    },
    {
      name: 'World',
      description: 'World Hello',
      operations: [],
    },
  ],
  paths: {
    '/hello': {
      get: {
        summary: 'Hello World',
        tags: ['Hello'],
      },
    },
    '/world': {
      post: {
        summary: 'World Hello',
        tags: ['World'],
      },
    },
  },
})

describe('getOperationsByTag', () => {
  it('returns operations for a specific tag', () => {
    const operationsSorter = (a: OpenAPIV3_1.OperationObject, b: OpenAPIV3_1.OperationObject) =>
      a.summary?.localeCompare(b.summary || b.path) ?? 0

    const tag: OpenAPIV3_1.TagObject = {
      name: 'Hello',
      description: 'Hello World',
      operations: [],
    }

    const operations = getOperationsByTag(collection.document as OpenAPIV3_1.Document, tag, {
      sort: operationsSorter,
    })

    expect(operations).toHaveLength(1)
    expect(operations[0].path).toBe('/hello')
    expect(operations[0].method).toBe('GET')
  })

  it('filters operations based on the filter function', () => {
    const tag: OpenAPIV3_1.TagObject = {
      name: 'Hello',
      description: 'Hello World',
      operations: [],
    }

    // Add a new path with a deprecated operation
    const testDocument = {
      ...collection.document,
      paths: {
        ...collection.document.paths,
        '/hello-deprecated': {
          get: {
            summary: 'Deprecated Hello',
            tags: ['Hello'],
            deprecated: true,
          },
        },
      },
    } as OpenAPIV3_1.Document

    // Test without filter - should get all operations
    const allOperations = getOperationsByTag(testDocument, tag)
    expect(allOperations).toHaveLength(2)

    // Test with filter to exclude deprecated operations
    const filteredOperations = getOperationsByTag(testDocument, tag, {
      filter: (operation) => !operation.deprecated,
    })
    expect(filteredOperations).toHaveLength(1)
    expect(filteredOperations[0].path).toBe('/hello')
    expect(filteredOperations[0].method).toBe('GET')
  })
})
