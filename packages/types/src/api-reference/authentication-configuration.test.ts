import { authenticationConfigurationSchema } from './authentication-configuration.ts'
import { describe, expect, it } from 'vitest'

describe('authenticationConfigurationSchema', () => {
  it('accepts empty record', () => {
    const config = {}
    expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
  })

  it('accepts partial security schemes', () => {
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

    expect(authenticationConfigurationSchema.parse(validConfig)).toEqual(validConfig)
  })

  it('rejects invalid security schemes', () => {
    const invalidConfig = {
      apiKey: {
        type: 'invalid', // Invalid type
        name: 123, // Invalid type for name
      },
    }

    expect(() => authenticationConfigurationSchema.parse(invalidConfig)).toThrow()
  })

  describe('preferredSecurityScheme', () => {
    it('accepts a single string security scheme', () => {
      const config = {
        preferredSecurityScheme: 'apiKey',
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts an array of security schemes', () => {
      const config = {
        preferredSecurityScheme: ['apiKey', 'basic'],
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts complex security with array of arrays', () => {
      const config = {
        preferredSecurityScheme: ['apiKey', ['basic', 'oauth2']],
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts null value', () => {
      const config = {
        preferredSecurityScheme: null,
      }
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('accepts undefined value', () => {
      const config = {}
      expect(authenticationConfigurationSchema.parse(config)).toEqual(config)
    })

    it('rejects invalid types', () => {
      const invalidConfigs = [
        { preferredSecurityScheme: 123 },
        { preferredSecurityScheme: {} },
        { preferredSecurityScheme: [{}] },
        { preferredSecurityScheme: [123] },
        { preferredSecurityScheme: [[123]] },
      ]

      invalidConfigs.forEach((config) => {
        expect(() => authenticationConfigurationSchema.parse(config)).toThrow()
      })
    })
  })
})
