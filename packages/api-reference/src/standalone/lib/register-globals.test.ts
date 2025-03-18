import { describe, expect, it } from 'vitest'
import { createApiReference } from './html-api/create-api-reference'
import { registerGlobals } from './register-globals'

describe('registerGlobals', () => {
  it('registers the createApiReference method on the global window', () => {
    expect(window.Scalar).toBeUndefined()
    registerGlobals()

    expect(window.Scalar).toBeDefined()
    expect(window.Scalar.createApiReference).toStrictEqual(createApiReference)
    expect(window.Scalar.createApiReference('#something', {})).toBeDefined()
  })
})
