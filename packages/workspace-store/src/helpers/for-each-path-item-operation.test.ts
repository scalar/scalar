import { describe, expect, it, vi } from 'vitest'

import { forEachPathItemOperation } from '@/helpers/for-each-path-item-operation'

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
