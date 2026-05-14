import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { describe, expect, it } from 'vitest'

import { buildPillContext } from './build-pill-context'

describe('build-pill-context', () => {
  it('builds a context-function pill for $guid', () => {
    expect(buildPillContext('$guid', undefined)).toEqual({
      type: 'contextFunction',
      identifier: '$guid',
      details: expect.any(String),
    })
  })

  it('builds an environment pill with the resolved value when the variable is defined', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'baseUrl', value: 'https://example.com' }],
    }
    expect(buildPillContext('baseUrl', env)).toEqual({
      type: 'environment',
      name: 'baseUrl',
      value: 'https://example.com',
      isDefined: true,
    })
  })

  it('reads the default field from structured variable values', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'apiKey', value: { default: 'secret', description: 'The API key' } }],
    }
    expect(buildPillContext('apiKey', env)).toMatchObject({
      type: 'environment',
      value: 'secret',
      isDefined: true,
    })
  })

  it('marks the pill as undefined and falls back to "No value" when the variable is missing', () => {
    expect(buildPillContext('missing', undefined)).toEqual({
      type: 'environment',
      name: 'missing',
      value: 'No value',
      isDefined: false,
    })
  })

  it('treats an empty string value as undefined for the purposes of the pill', () => {
    const env: XScalarEnvironment = {
      color: '#fff',
      variables: [{ name: 'baseUrl', value: '' }],
    }
    expect(buildPillContext('baseUrl', env)).toEqual({
      type: 'environment',
      name: 'baseUrl',
      value: 'No value',
      isDefined: false,
    })
  })
})
