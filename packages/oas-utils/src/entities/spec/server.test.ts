import { describe, expect, it } from 'vitest'

import { serverSchema } from './server'

describe('serverSchema', () => {
  it('validates valid server object', () => {
    const server = { url: 'https://api.example.com' }
    expect(serverSchema.parse(server)).toMatchObject(server)
  })

  it('validates server with description', () => {
    const server = {
      url: 'https://api.example.com',
      description: 'Production API',
    }
    expect(serverSchema.parse(server)).toMatchObject(server)
  })

  it('validates server with variables', () => {
    const server = {
      url: 'https://{username}.example.com',
      variables: {
        username: {
          default: 'demo',
        },
      },
    }
    expect(serverSchema.parse(server)).toMatchObject(server)
  })

  it('validates server with enum variables', () => {
    const server = {
      url: 'https://{environment}.example.com',
      variables: {
        environment: {
          enum: ['dev', 'staging', 'prod'],
          default: 'dev',
          description: 'Environment selection',
        },
      },
    }
    expect(serverSchema.parse(server)).toMatchObject(server)
  })

  it('fails when URL is missing', () => {
    const server = {}
    expect(() => serverSchema.parse(server)).toThrow()
  })

  it('fails when variable default is not in enum', () => {
    const server = {
      url: 'https://{environment}.example.com',
      variables: {
        environment: {
          enum: ['dev', 'staging', 'prod'],
          default: 'invalid',
          description: 'Environment selection',
        },
      },
    }
    expect(() => serverSchema.parse(server)).toThrow(
      'Default value must be one of the enum values if enum is defined',
    )
  })

  it('validates server with relative URL', () => {
    const server = {
      url: '/api/v1',
      description: 'Relative URL',
    }
    expect(serverSchema.parse(server)).toMatchObject(server)
  })

  it('validates server with multiple variables', () => {
    const server = {
      url: 'https://{username}.{domain}.com',
      variables: {
        username: {
          default: 'demo',
        },
        domain: {
          enum: ['example', 'test'],
          default: 'example',
        },
      },
    }
    expect(serverSchema.parse(server)).toMatchObject(server)
  })
})
