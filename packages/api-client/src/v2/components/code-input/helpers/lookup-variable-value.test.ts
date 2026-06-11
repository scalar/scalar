import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { describe, expect, it } from 'vitest'

import { lookupVariableValue } from './lookup-variable-value'

describe('lookup-variable-value', () => {
  it('returns undefined when the environment is undefined', () => {
    expect(lookupVariableValue(undefined, 'baseUrl')).toBeUndefined()
  })

  it('returns undefined when the variable is not declared', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'apiKey', value: 'secret' }],
    }
    expect(lookupVariableValue(env, 'baseUrl')).toBeUndefined()
  })

  it('returns the string value when the variable is a plain string', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'baseUrl', value: 'https://example.com' }],
    }
    expect(lookupVariableValue(env, 'baseUrl')).toBe('https://example.com')
  })

  it('returns the default field when the variable value is structured', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'apiKey', value: { default: 'secret', description: 'The API key' } }],
    }
    expect(lookupVariableValue(env, 'apiKey')).toBe('secret')
  })

  it('returns an empty string when the variable is explicitly empty', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'baseUrl', value: '' }],
    }
    expect(lookupVariableValue(env, 'baseUrl')).toBe('')
  })
})
