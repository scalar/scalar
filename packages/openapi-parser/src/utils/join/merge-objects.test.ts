import { describe, expect, it } from 'vitest'

import { mergeObjects } from '@/utils/join/merge-objects'

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

  it('does not pollute Object.prototype through a malicious __proto__ key', () => {
    // JSON.parse keeps `__proto__` as an own enumerable key (unlike an object literal), which is the
    // exact vector a crafted document would use.
    const malicious = JSON.parse('{ "__proto__": { "polluted": "yes" } }')

    mergeObjects({}, malicious)

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('does not pollute through a constructor key', () => {
    const malicious = JSON.parse('{ "constructor": { "prototype": { "polluted": "yes" } } }')

    mergeObjects({}, malicious)

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype).not.toHaveProperty('polluted')
  })
})
