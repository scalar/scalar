import { describe, expect, it } from 'vitest'
import { createEnvironmentUtils } from './create-environment-utils'

describe('createEnvironmentUtils', () => {
  it('returns values from provided environment object', () => {
    const env = {
      FOOBAR: 'test',
      API_URL: 'http://test.com',
      nested: { foo: 'bar' },
    }
    const envUtils = createEnvironmentUtils(env)
    expect(envUtils.get('FOOBAR')).toBe('test')
    expect(envUtils.get('API_URL')).toBe('http://test.com')
    expect(envUtils.get('nested')).toEqual({ foo: 'bar' })
  })

  it('returns undefined for non-existent variables', () => {
    const envUtils = createEnvironmentUtils({})
    expect(envUtils.get('NON_EXISTENT')).toBeUndefined()
  })

  it('set method always returns false', () => {
    const envUtils = createEnvironmentUtils({})
    expect(envUtils.set()).toBe(false)
  })
})
