import { updateOriginalDocument } from '@/helpers/update-original-document'
import { describe, expect, it } from 'vitest'

describe('updateOriginalDocument', () => {
  it('should update the original document with the changes from the updated document', () => {
    const result = updateOriginalDocument(
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
  })

  it('should skip changes on external documents', () => {
    const result = updateOriginalDocument(
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
      },
    )

    expect(result).toEqual({
      a: 0,
      b: {
        c: 2,
        d: 5,
      },
    })
  })

  it('should not update refs', () => {
    const result = updateOriginalDocument(
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
  })
})
