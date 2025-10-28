import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { xScalarEnvVarSchema, xScalarEnvironmentSchema, xScalarEnvironmentsSchema } from './x-scalar-environments'

describe('xScalarEnvVarSchema', () => {
  it('validates environment variables with description and default', () => {
    const validVar = {
      description: 'API key for production',
      default: 'default-key',
    }

    expect(Value.Check(xScalarEnvVarSchema, validVar)).toBe(true)
  })

  it('validates environment variables as plain strings', () => {
    const validVar = 'simple-value'

    expect(Value.Check(xScalarEnvVarSchema, validVar)).toBe(true)
  })
})

describe('xScalarEnvironmentSchema', () => {
  it('validates complete environment configuration', () => {
    const validEnvironment = {
      description: 'Production environment',
      color: '#ff0000',
      variables: {
        API_KEY: {
          description: 'Production API key',
          default: 'prod-key',
        },
        BASE_URL: 'https://api.example.com',
      },
    }

    expect(Value.Check(xScalarEnvironmentSchema, validEnvironment)).toBe(true)
  })

  it('validates minimal environment with only variables', () => {
    const minimalEnvironment = {
      variables: {
        TOKEN: 'abc123',
      },
    }

    expect(Value.Check(xScalarEnvironmentSchema, minimalEnvironment)).toBe(true)
  })
})

describe('xScalarEnvironmentsSchema', () => {
  it('validates multiple environments with mixed variable types', () => {
    const validConfig = {
      'x-scalar-environments': {
        production: {
          description: 'Production environment',
          color: '#00ff00',
          variables: {
            API_KEY: {
              description: 'Production API key',
              default: 'prod-key',
            },
            BASE_URL: 'https://api.example.com',
          },
        },
        staging: {
          description: 'Staging environment',
          variables: {
            API_KEY: 'staging-key',
            BASE_URL: {
              default: 'https://staging.example.com',
            },
          },
        },
      },
    }

    expect(Value.Check(xScalarEnvironmentsSchema, validConfig)).toBe(true)
  })

  it('rejects invalid structure with missing required fields', () => {
    const invalidConfig = {
      'x-scalar-environments': {
        production: {
          // Missing required 'variables' field
          description: 'Production environment',
        },
      },
    }

    expect(Value.Check(xScalarEnvironmentsSchema, invalidConfig)).toBe(false)
  })
})
