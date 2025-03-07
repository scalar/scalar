import { registerScalar } from '@/standalone/lib/global-scalar'
import { describe, expect, it } from 'vitest'

describe('global-scalar', () => {
  it('registers a function in the Scalar object', () => {
    const foobar = (a: number, b: number) => a + b

    expect(window.Scalar).toBeUndefined()

    registerScalar(foobar)

    expect(window.Scalar).toBeDefined()
    // @ts-expect-error TypeScript doesn’t know that the Scalar object exists
    expect(window.Scalar.foobar).toStrictEqual(foobar)

    // @ts-expect-error TypeScript doesn’t know that the Scalar object exists
    expect(window.Scalar.foobar(1, 2)).toBe(3)
  })
})
