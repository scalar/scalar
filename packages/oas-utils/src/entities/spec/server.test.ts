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
        username: {
          // invalid enum
          enum: [],
          default: 'demo',
          description: 'Username selection',
        },
        version: {
          enum: ['v1', 'v2'],
          description: 'Version selection',
        },
      },
    }

    expect(serverSchema.parse(server)).toStrictEqual({
      uid: expect.any(String),
      url: 'https://{environment}.example.com',
      variables: {
        environment: {
          enum: ['dev', 'staging', 'prod'],
          // kept
          default: 'dev',
          description: 'Environment selection',
        },
        username: {
          // enum omitted
          default: 'demo',
          description: 'Username selection',
        },
        version: {
          enum: ['v1', 'v2'],
          // added
          default: 'v1',
          description: 'Version selection',
        },
      },
    })
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

    expect(serverSchema.parse(server)).toMatchObject({
      url: 'https://{environment}.example.com',
      variables: {
        environment: {
          enum: ['dev', 'staging', 'prod'],
          default: 'dev',
          description: 'Environment selection',
        },
      },
    })
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
