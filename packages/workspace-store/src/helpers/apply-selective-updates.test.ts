import { describe, expect, it } from 'vitest'

import { applySelectiveUpdates } from '@/helpers/apply-selective-updates'

describe('applySelectiveUpdates', () => {
  it('should update the original document with the changes from the updated document', () => {
    const input = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
    }
    const excludedDiffs = applySelectiveUpdates(input, {
      a: 0,
      b: {
        c: 2,
        d: 5,
      },
    })

    expect(input).toEqual({
      a: 0,
      b: {
        c: 2,
        d: 5,
      },
    })

    expect(excludedDiffs).toEqual([])
  })

  it('should skip changes on external documents', () => {
    const input = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
    }

    const excludedDiffs = applySelectiveUpdates(input, {
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
    })

    expect(input).toEqual({
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

  it('should skip navigation properties', () => {
    const input = {
      a: 1,
      b: {
        c: 2,
      },
    }

    const excludedDiffs = applySelectiveUpdates(input, {
      a: 0,
      b: {
        c: 2,
      },
      'x-scalar-navigation': [
        {
          someProp: 'someValue',
        },
      ],
    })

    expect(input).toEqual({
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
