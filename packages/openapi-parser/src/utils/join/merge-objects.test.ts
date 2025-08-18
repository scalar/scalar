import { mergeObjects } from '@/utils/join/merge-objects'
import { expect, it, describe } from 'vitest'

describe('mergeObjects', () => {
  it('should merge objects that does not have any conflicting keys', () => {
    const a = {
      a: 'Hello',
    }

    const b = {
      b: 'Hello',
    }

    expect(mergeObjects(a, b)).toEqual({
      a: a.a,
      b: b.b,
    })
  })

  it('should merge objects correctly even when they have the same key with the same value', () => {
    const a = {
      a: 'Hello',
    }

    const b = {
      a: 'Hello',
    }

    expect(mergeObjects(a, b)).toEqual({
      a: a.a,
    })
  })

  it('should deeply merge the objects', () => {
    const a = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    }

    const b = {
      a: {
        b: {
          d: {
            e: 1,
          },
        },
      },
    }

    expect(mergeObjects(a, b)).toEqual({
      a: {
        b: {
          c: {
            d: 1,
          },
          d: {
            e: 1,
          },
        },
      },
    })
  })

  it('should deeply merge the objects when there is same keys', () => {
    const a = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    }

    const b = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
      b: 1,
    }

    expect(mergeObjects(a, b)).toEqual({
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
      b: 1,
    })
  })

  it('should deeply merge the objects and rewrite the same key with the new value', () => {
    const a = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    }

    const b = {
      a: {
        b: {
          c: {
            d: 3,
          },
        },
      },
      b: 2,
    }

    expect(mergeObjects(a, b)).toEqual({
      a: {
        b: {
          c: {
            d: 3,
          },
        },
      },
      b: 2,
    })
  })
})
