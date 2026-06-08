import { describe, expect, it, vi } from 'vitest'

import { forEachPathItemOperation, getResolvedPathItem, pathItemIsEmpty } from '@/helpers/for-each-path-item-operation'

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
      ['get', { summary: 'Get users' }],
      ['post', { summary: 'Create user' }],
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
    expect(callback.mock.calls).toStrictEqual([['get', { summary: 'Get users' }]])
  })

  it('does not invoke the callback when the path item is undefined', () => {
    const callback = vi.fn()

    forEachPathItemOperation(undefined, callback)

    expect(callback).not.toHaveBeenCalled()
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
