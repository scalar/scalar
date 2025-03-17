import { authenticationConfigurationSchema } from './authentication-configuration.ts'
import { describe, expect, it } from 'vitest'

describe('authenticationConfigurationSchema', () => {
  it('should accept empty record', () => {
    expect(authenticationConfigurationSchema.safeParse({}).success).toBe(true)
  })

  it('should accept partial security schemes', () => {
    const validConfig = {
      apiKey: {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      },
      basic: {
        type: 'http',
        scheme: 'basic',
      },
    }

    expect(authenticationConfigurationSchema.safeParse(validConfig).success).toBe(true)
  })

  it('should reject invalid security schemes', () => {
    const invalidConfig = {
      apiKey: {
        type: 'invalid', // Invalid type
        name: 123, // Invalid type for name
      },
    }

    expect(authenticationConfigurationSchema.safeParse(invalidConfig).success).toBe(false)
  })
})
