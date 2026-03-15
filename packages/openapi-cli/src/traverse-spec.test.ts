import { describe, expect, it } from 'vitest'

import { traverseSpec } from './traverse-spec.js'

describe('traverse-spec', () => {
  it('returns operations from paths', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0' },
      paths: {
        '/planets': {
          get: {
            operationId: 'getAllData',
            summary: 'Get all planets',
            parameters: [{ name: 'limit', in: 'query' }],
          },
          post: {
            operationId: 'createPlanet',
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { name: { type: 'string' } } },
                },
              },
            },
          },
        },
      },
    }
    const ops = traverseSpec(spec as never)
    expect(ops.length).toBe(2)
    const getOp = ops.find((o) => o.method === 'get')
    expect(getOp?.path).toBe('/planets')
    expect(getOp?.resource).toBe('planets')
    expect(getOp?.action).toBe('getAllData')
    expect(getOp?.queryParams.map((p) => p.name)).toContain('limit')
    const postOp = ops.find((o) => o.method === 'post')
    expect(postOp?.bodyFlagKeys).toContain('name')
  })

  it('derives prefix and resource from path segments', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0' },
      paths: {
        '/v2/core/accounts': {
          post: { operationId: 'create' },
        },
      },
    }
    const ops = traverseSpec(spec as never)
    expect(ops.length).toBe(1)
    expect(ops[0]?.prefixSegments).toEqual(['v2', 'core'])
    expect(ops[0]?.resource).toBe('accounts')
    expect(ops[0]?.action).toBe('create')
  })

  it('derives action from method when no operationId', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0' },
      paths: {
        '/users': {
          post: {},
        },
      },
    }
    const ops = traverseSpec(spec as never)
    expect(ops[0]?.action).toBe('create')
  })
})
