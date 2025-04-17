import { registerGlobals } from './register-globals'
import { describe, expect, it } from 'vitest'
import { createApiReference } from './html-api'

describe('registerGlobals', () => {
  it('registers the createApiReference method on the global window', () => {
    expect(window.Scalar).toBeUndefined()
    registerGlobals()

    expect(window.Scalar).toBeDefined()
    expect(window.Scalar.createApiReference).toStrictEqual(createApiReference)
    expect(window.Scalar.createApiReference('#something', {})).toBeDefined()
  })

  it('registers a default app instance globally', () => {
    registerGlobals()

    expect(window.Scalar.createApiReference('#something', {})).toBeDefined()
    expect(window.Scalar.apps['default']).toMatchObject({
      app: expect.any(Object),
      destroy: expect.any(Function),
      getConfiguration: expect.any(Function),
      updateConfiguration: expect.any(Function),
    })
  })

  it('registers a named app instance globally', () => {
    registerGlobals()

    expect(window.Scalar.createApiReference('#something', {}, 'my-app')).toBeDefined()
    expect(window.Scalar.apps['my-app']).toMatchObject({
      app: expect.any(Object),
      destroy: expect.any(Function),
      getConfiguration: expect.any(Function),
      updateConfiguration: expect.any(Function),
    })
  })
})
