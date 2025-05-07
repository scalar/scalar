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
})
