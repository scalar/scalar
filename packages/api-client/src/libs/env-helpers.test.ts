import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { describe, expect, it } from 'vitest'
import { nanoid } from 'nanoid'

import { getEnvColor } from './env-helpers'

describe('getEnvColor', () => {
  it('returns the environment color when provided', () => {
    const env = environmentSchema.parse({
      uid: nanoid(),
      color: '#FF0000',
      name: 'Production',
      value: 'production',
    })

    expect(getEnvColor(env)).toBe('#FF0000')
  })

  it('returns default color when environment is undefined', () => {
    // @ts-expect-error testing undefined
    expect(getEnvColor(undefined)).toBe('#FFFFFF')
  })

  it('returns default color when environment is null', () => {
    // @ts-expect-error testing null
    expect(getEnvColor(null)).toBe('#FFFFFF')
  })
})
