import { describe, expect, it, vi } from 'vitest'

import {
  deletePathItemOperation,
  forEachPathItemOperation,
  getPathItemOperation,
  getResolvedPathItem,
  pathItemIsEmpty,
} from '@/helpers/for-each-path-item-operation'

describe('getResolvedPathItem', () => {
  it('includes parameters declared alongside a path $ref on the paths map', () => {
    const resolved = getResolvedPathItem({
      $ref: '#/components/pathItems/UsersPath',
      '$ref-value': {
        get: { summary: 'Get users' },
      },
      parameters: [{ name: 'fromPath', in: 'header' }],
    })

    expect(resolved?.parameters).toEqual([{ name: 'fromPath', in: 'header' }])
    expect(resolved?.get).toEqual({ summary: 'Get users' })
  })

  it('lets path-level siblings override the referenced path item', () => {
    const resolved = getResolvedPathItem({
      $ref: '#/components/pathItems/UsersPath',
      '$ref-value': {
        get: { summary: 'Get users' },
        parameters: [{ name: 'fromComponent', in: 'query' }],
      },
      parameters: [{ name: 'fromPath', in: 'header' }],
    })

    expect(resolved?.parameters).toEqual([{ name: 'fromPath', in: 'header' }])
  })
})

describe('forEachPathItemOperation', () => {
  it('invokes the callback for each HTTP method on an inline path item', () => {
    const callback = vi.fn()

    forEachPathItemOperation(
      {
        get: { summary: 'Get users' },
        post: { summary: 'Create user' },
        summary: 'User path',
      },
      callback,
    )

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback.mock.calls).toStrictEqual([
      ['get', { summary: 'Get users' }, ['get']],
      ['post', { summary: 'Create user' }, ['post']],
    ])
  })

  it('resolves operations from a $ref path item wrapper', () => {
    const callback = vi.fn()

    forEachPathItemOperation(
      {
        $ref: '#/components/pathItems/UsersPath',
        '$ref-value': {
          get: { summary: 'Get users' },
        },
      },
      callback,
    )

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls).toStrictEqual([['get', { summary: 'Get users' }, ['get']]])
  })

  it('invokes the callback for OpenAPI 3.2 additionalOperations with arbitrary custom methods', () => {
    const callback = vi.fn()

    forEachPathItemOperation(
      {
        get: { summary: 'Get users with query parameters' },
        additionalOperations: {
          LIST: { summary: 'Get users with request body' },
          COPY: { summary: 'Copy users with request body' },
        },
      },
      callback,
    )

    expect(callback).toHaveBeenCalledTimes(3)
    expect(callback.mock.calls).toStrictEqual([
      ['get', { summary: 'Get users with query parameters' }, ['get']],
      ['LIST', { summary: 'Get users with request body' }, ['additionalOperations', 'LIST']],
      ['COPY', { summary: 'Copy users with request body' }, ['additionalOperations', 'COPY']],
    ])
  })

  it('does not invoke the callback when the path item is undefined', () => {
    const callback = vi.fn()

    forEachPathItemOperation(undefined, callback)

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('getPathItemOperation', () => {
  it('resolves OpenAPI 3.2 additionalOperations regardless of custom method name', () => {
    const pathItem = {
      additionalOperations: {
        PURGE: {
          summary: 'Purge users with request body',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    }

    expect(getPathItemOperation(pathItem, 'PURGE')?.requestBody).toBeDefined()
    expect(getPathItemOperation(pathItem, 'purge')?.requestBody).toBeDefined()
  })
})

describe('deletePathItemOperation', () => {
  it('removes the method from an inline path item', () => {
    const pathItem = { get: { summary: 'Get users' }, post: { summary: 'Create user' } }

    deletePathItemOperation(pathItem, 'get')

    expect(pathItem).toEqual({ post: { summary: 'Create user' } })
  })

  it('removes the method from the dereferenced value of a $ref wrapper', () => {
    const pathItem = {
      $ref: '#/components/pathItems/UsersPath',
      '$ref-value': { get: { summary: 'Get users' }, post: { summary: 'Create user' } },
    }

    deletePathItemOperation(pathItem, 'get')

    expect(getResolvedPathItem(pathItem)?.get).toBeUndefined()
    expect(getResolvedPathItem(pathItem)?.post).toEqual({ summary: 'Create user' })
  })

  it('removes a method override declared alongside a $ref wrapper', () => {
    const pathItem = {
      $ref: '#/components/pathItems/UsersPath',
      '$ref-value': { get: { summary: 'Referenced get' } },
      get: { summary: 'Overridden get' },
    }

    deletePathItemOperation(pathItem, 'get')

    // The sibling override takes precedence in the merged view, so deleting only the
    // dereferenced copy would leave the operation visible.
    expect(getResolvedPathItem(pathItem)?.get).toBeUndefined()
  })
})

describe('pathItemIsEmpty', () => {
  it('returns true for an undefined or empty path item', () => {
    expect(pathItemIsEmpty(undefined)).toBe(true)
    expect(pathItemIsEmpty({})).toBe(true)
  })

  it('returns false when only path-level metadata remains', () => {
    expect(pathItemIsEmpty({ parameters: [{ name: 'id', in: 'path' }] })).toBe(false)
    expect(pathItemIsEmpty({ summary: 'User path' })).toBe(false)
  })

  it('returns false when an HTTP method remains', () => {
    expect(pathItemIsEmpty({ get: { summary: 'Get users' } })).toBe(false)
  })

  it('treats a $ref wrapper as non-empty', () => {
    expect(
      pathItemIsEmpty({
        $ref: '#/components/pathItems/UsersPath',
        '$ref-value': {},
      }),
    ).toBe(false)
  })
})
