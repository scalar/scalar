import type { Environment } from '@scalar/oas-utils/entities/environment'
import { describe, expect, it } from 'vitest'

import { getEnvColor } from './env-helpers'

describe('getEnvColor', () => {
  it('returns the environment color when provided', () => {
    const env: Environment = {
      color: '#FF0000',
      name: 'Production',
      value: 'production',
      uid: '123',
    }

    expect(getEnvColor(env)).toBe('#FF0000')
  })

  it('returns default color when environment is undefined', () => {
    // @ts-expect-error testing undefined
    expect(getEnvColor(undefined)).toBe('#8E8E8E')
  })

  it('returns default color when environment is null', () => {
    // @ts-expect-error testing null
    expect(getEnvColor(null)).toBe('#8E8E8E')
  })
})
