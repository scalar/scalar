import { describe, expect, it, vi } from 'vitest'

import {
  deletePathItemOperation,
  forEachPathItemOperation,
  getResolvedPathItem,
  pathItemIsEmpty,
} from '@/helpers/for-each-path-item-operation'
import type { NodeInput } from '@/helpers/get-resolved-ref'
import type { PathItemObject } from '@/schemas/v3.1/strict/path-item'

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

  /**
   * The shape bundling produces for a split file that holds nothing but a `$ref` to another file:
   * the bucket entry the path item points at is a reference in its own right. `$ref-value` is typed
   * as a resolved path item, which by definition cannot hold another one, so the hop is cast in.
   */
  const chainedPathItem = () =>
    ({
      '$ref': '#/x-ext/3bc5a94',
      '$ref-value': {
        '$ref': '#/x-ext/43932ba',
        '$ref-value': { get: { summary: 'List all moons' } },
      } as unknown as PathItemObject,
    }) satisfies NodeInput<PathItemObject>

  it('follows a reference whose target is itself a reference', () => {
    const resolved = getResolvedPathItem(chainedPathItem())

    expect(resolved?.get).toEqual({ summary: 'List all moons' })
  })

  it('keeps the outermost $ref when it follows a chain', () => {
    // The reference the author wrote is the one worth keeping: it is what externalization skips and
    // what `restoreOriginalRefs` maps back to the original URL. Asserted together with the resolved
    // operation, because the outer `$ref` survives a single hop too — on its own it would pass
    // without the chain ever being followed.
    const resolved = getResolvedPathItem(chainedPathItem())

    expect(resolved).toEqual({
      '$ref': '#/x-ext/3bc5a94',
      'get': { summary: 'List all moons' },
    })
  })

  it('gives up on a reference cycle rather than following it forever', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // A reference at itself. Resolving it produces another hop every time, so only a cap terminates.
    const cycle: Record<string, unknown> = { $ref: '#/components/pathItems/Loop' }
    cycle['$ref-value'] = cycle

    const resolved = getResolvedPathItem(cycle)

    // `$ref-value` is meant to be virtual, so the hop that was never followed must not be handed back
    // on a path item the caller may go on to store or serialize.
    expect(resolved).not.toHaveProperty('$ref-value')
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })

  it('does not spread a reference whose target is not an object', () => {
    // Spreading a string copies it character by character, so a pointer at a title used to resolve
    // into `{ 0: 'G', 1: 'a', ... }` and every consumer downstream read those digits as properties.
    const resolved = getResolvedPathItem({
      '$ref': '#/info/title',
      '$ref-value': 'Galaxy' as unknown as Record<string, never>,
    })

    expect(resolved).toEqual({ $ref: '#/info/title' })
  })

  it('does not spread a reference whose target is an array', () => {
    const resolved = getResolvedPathItem({
      '$ref': '#/components/pathItems/List',
      '$ref-value': [{ get: { summary: 'List all moons' } }] as unknown as Record<string, never>,
    })

    expect(resolved).toEqual({ $ref: '#/components/pathItems/List' })
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

describe('deletePathItemOperation', () => {
  it('removes the method through a chain of references', () => {
    // `getResolvedPathItem` resolves through chains, so anything that writes has to reach as far as
    // reading does — otherwise the delete silently no-ops and the operation keeps being served.
    const pathItem = {
      '$ref': '#/x-ext/3bc5a94',
      '$ref-value': {
        '$ref': '#/x-ext/43932ba',
        '$ref-value': { get: { summary: 'List all moons' } },
      } as unknown as PathItemObject,
    } satisfies NodeInput<PathItemObject>

    deletePathItemOperation(pathItem, 'get')

    expect(getResolvedPathItem(pathItem)?.get).toBeUndefined()
  })

  it('removes a method overridden partway along a chain', () => {
    // A sibling on an intermediate hop takes precedence over the target, so a copy left there keeps
    // surfacing even once the deepest one is gone.
    const pathItem = {
      '$ref': '#/x-ext/3bc5a94',
      '$ref-value': {
        '$ref': '#/x-ext/43932ba',
        'get': { summary: 'Overridden partway' },
        '$ref-value': { get: { summary: 'List all moons' } },
      } as unknown as PathItemObject,
    } satisfies NodeInput<PathItemObject>

    deletePathItemOperation(pathItem, 'get')

    expect(getResolvedPathItem(pathItem)?.get).toBeUndefined()
  })

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
