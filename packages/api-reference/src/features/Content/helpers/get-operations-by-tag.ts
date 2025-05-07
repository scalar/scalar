import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { createCollection } from '@scalar/store'
import { describe, expect, it } from 'vitest'

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
})

/**
 * Takes an OpenAPI Document and a tag, and returns an array of operations that have the tag.
 */
function getOperationsByTag(
  content: OpenAPIV3_1.Document,
  tag: OpenAPIV3_1.TagObject,
  {
    sort,
  }: {
    sort?: 'alpha' | 'method' | ((a: OpenAPIV3_1.OperationObject, b: OpenAPIV3_1.OperationObject) => number)
  } = {},
) {
  const operations: {
    method: OpenAPIV3_1.HttpMethods
    path: string
    operation: OpenAPIV3_1.OperationObject
  }[] = []

  if (!content.paths) {
    return operations
  }

  // Loop through all paths in the document
  Object.entries(content.paths).forEach(([path, pathItem]) => {
    if (!pathItem) {
      return
    }

    // Loop through all HTTP methods in the path
    Object.entries(pathItem).forEach(([method, operation]) => {
      // Skip if not an operation or if operation doesn't have tags
      if (typeof operation === 'string' || !operation?.tags) {
        return
      }

      // Check if the operation has our target tag
      if (operation.tags.includes(tag.name)) {
        operations.push({
          method: method.toUpperCase() as OpenAPIV3_1.HttpMethods,
          path,
          operation,
        })
      }
    })
  })

  // Sort operations by path
  if (sort === 'alpha') {
    return operations.sort((a, b) => a.path.localeCompare(b.path))
  }

  // Sort operations by method
  if (sort === 'method') {
    return operations.sort((a, b) => a.method.localeCompare(b.method))
  }

  // Sort operations by a custom function
  if (typeof sort === 'function') {
    return operations.sort((a, b) => sort(a.operation, b.operation))
  }

  return operations
}
