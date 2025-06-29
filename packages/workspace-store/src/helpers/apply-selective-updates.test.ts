import { applySelectiveUpdates } from '@/helpers/apply-selective-updates'
import { describe, expect, it } from 'vitest'

describe('applySelectiveUpdates', () => {
  it('should update the original document with the changes from the updated document', () => {
    const [result, excludedDiffs] = applySelectiveUpdates(
      {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
      },
      {
        a: 0,
        b: {
          c: 2,
          d: 5,
        },
      },
    )

    expect(result).toEqual({
      a: 0,
      b: {
        c: 2,
        d: 5,
      },
    })

    expect(excludedDiffs).toEqual([])
  })

  it('should skip changes on external documents', () => {
    const [result, excludedDiffs] = applySelectiveUpdates(
      {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
      },
      {
        a: 0,
        b: {
          c: 2,
          d: 5,
        },
        'x-ext': {
          'b42js': {
            description: 'External document',
          },
        },
        'x-ext-urls': {
          'b42js': 'https://example.com/external-doc',
        },
      },
    )

    expect(result).toEqual({
      a: 0,
      b: {
        c: 2,
        d: 5,
      },
    })

    expect(excludedDiffs).toEqual([
      {
        changes: {
          b42js: {
            description: 'External document',
          },
        },
        path: ['x-ext'],
        type: 'add',
      },
      {
        changes: {
          b42js: 'https://example.com/external-doc',
        },
        path: ['x-ext-urls'],
        type: 'add',
      },
    ])
  })

  it('should not update refs', () => {
    const [result, excludedDiffs] = applySelectiveUpdates(
      {
        a: 1,
        b: {
          c: 2,
          d: 3,
          e: {
            $ref: 'http://example.com/some-ref',
          },
        },
      },
      {
        a: 0,
        b: {
          c: 2,
          d: 5,
          e: {
            $ref: '#/definitions/internal-ref',
            $status: 'loading',
          },
        },
      },
    )

    expect(result).toEqual({
      a: 0,
      b: {
        c: 2,
        d: 5,
        e: {
          $ref: 'http://example.com/some-ref',
        },
      },
    })

    expect(excludedDiffs).toEqual([
      {
        changes: '#/definitions/internal-ref',
        path: ['b', 'e', '$ref'],
        type: 'update',
      },
      {
        changes: 'loading',
        path: ['b', 'e', '$status'],
        type: 'add',
      },
    ])
  })

  it('should skip navigation properties', () => {
    const [result, excludedDiffs] = applySelectiveUpdates(
      {
        a: 1,
        b: {
          c: 2,
        },
      },
      {
        a: 0,
        b: {
          c: 2,
        },
        'x-scalar-navigation': [
          {
            someProp: 'someValue',
          },
        ],
      },
    )

    expect(result).toEqual({
      a: 0,
      b: {
        c: 2,
      },
    })

    expect(excludedDiffs).toEqual([
      {
        changes: [
          {
            someProp: 'someValue',
          },
        ],
        path: ['x-scalar-navigation'],
        type: 'add',
      },
    ])
  })
})
