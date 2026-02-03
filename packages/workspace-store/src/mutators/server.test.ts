import { describe, expect, it } from 'vitest'

import type { WorkspaceDocument } from '@/schemas'

import { addServer, deleteServer, updateSelectedServer, updateServer, updateServerVariables } from './server'

/**
 * Helper to create a minimal WorkspaceDocument for testing.
 */
function createDocument(initial?: Partial<WorkspaceDocument>): WorkspaceDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

describe('addServer', () => {
  it('adds a new server and initializes servers array when missing', () => {
    const document = createDocument()

    const result = addServer(document)

    expect(result).toBeDefined()
    expect(document.servers).toHaveLength(1)
    expect(document.servers?.[0]).toEqual(result)
    expect(result?.url).toBeDefined()
  })

  it('adds a new server to existing servers array', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    const result = addServer(document)

    expect(result).toBeDefined()
    expect(document.servers).toHaveLength(2)
    expect(document.servers?.[0]).toEqual({ url: 'https://api.example.com' })
    expect(document.servers?.[1]).toEqual(result)
  })

  it('returns undefined when document is null', () => {
    const result = addServer(null)

    expect(result).toBeUndefined()
  })
})

describe('updateServer', () => {
  it('updates an existing server and preserves other properties', () => {
    const document = createDocument({
      servers: [
        { url: 'https://api.example.com', description: 'Production API' },
        { url: 'https://dev.example.com', description: 'Development API' },
      ],
    })

    const result = updateServer(document, {
      index: 0,
      server: { url: 'https://api-v2.example.com' },
    })

    expect(result).toBeDefined()
    expect(result?.url).toBe('https://api-v2.example.com')
    expect(result?.description).toBe('Production API')
    expect(document.servers?.[0]).toEqual(result)
    // Second server should remain unchanged
    expect(document.servers?.[1]).toEqual({ url: 'https://dev.example.com', description: 'Development API' })
  })

  it('adds a path variable when URL changes and contains path variables', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://{environment}.example.com/{version}',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://{environment}.example.com/{version}')
    expect(document.servers?.[0]?.variables).toEqual({
      environment: {
        default: 'api',
        enum: ['api', 'dev', 'staging'],
      },
      version: {
        default: '',
      },
    })
  })

  it('deletes a path variable when URL changes and no longer contains that one', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://staging.example.com/',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://staging.example.com/')
    expect(document.servers?.[0]?.variables).toEqual({})
  })

  it('renames a path variable when URL changes and contains a different variable', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.{domain}.com/{path}',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
            domain: {
              default: 'example',
              enum: ['example', 'dev-example', 'staging-example'],
            },
            path: {
              default: '',
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://{environment}.{address}.com/{path}',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://{environment}.{address}.com/{path}')
    expect(document.servers?.[0]?.variables).toEqual({
      environment: {
        default: 'api',
        enum: ['api', 'dev', 'staging'],
      },
      address: {
        default: 'example',
        enum: ['example', 'dev-example', 'staging-example'],
      },
      path: {
        default: '',
      },
    })
  })

  it('creates and deletes path variables when URL changes and contains a different variable at a different position', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.{domain}.com/{path}',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
            domain: {
              default: 'example',
              enum: ['example', 'dev-example', 'staging-example'],
            },
            path: {
              default: '',
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://{environment}.example.{tld}/{path}',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://{environment}.example.{tld}/{path}')
    expect(document.servers?.[0]?.variables).toEqual({
      environment: {
        default: 'api',
        enum: ['api', 'dev', 'staging'],
      },
      tld: {
        default: '',
      },
      path: {
        default: '',
      },
    })
  })

  it('does not detect variables when URL has not changed', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://api.example.com',
        },
      ],
    })

    const result = updateServer(document, {
      index: 0,
      server: { description: 'Updated description' },
    })

    expect(result).toBeDefined()
    expect(result?.url).toBe('https://api.example.com')
    expect(result?.description).toBe('Updated description')
  })

  it('returns undefined when updating a non-existent server', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    const result = updateServer(document, {
      index: 5,
      server: { url: 'https://new.example.com' },
    })

    expect(result).toBeUndefined()
    // Original servers array should remain unchanged
    expect(document.servers).toHaveLength(1)
  })

  it('initializes servers array when updating and array is missing', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    // Manually remove servers to simulate edge case
    delete document.servers

    const result = updateServer(document, {
      index: 0,
      server: { url: 'https://new.example.com' },
    })

    expect(result).toBeUndefined()
  })
})

describe('deleteServer', () => {
  it('deletes a server at the specified index', () => {
    const document = createDocument({
      servers: [
        { url: 'https://api.example.com' },
        { url: 'https://dev.example.com' },
        { url: 'https://staging.example.com' },
      ],
    })

    deleteServer(document, { index: 1 })

    expect(document.servers).toHaveLength(2)
    expect(document.servers?.[0]).toEqual({ url: 'https://api.example.com' })
    expect(document.servers?.[1]).toEqual({ url: 'https://staging.example.com' })
  })

  it('handles deleting the only server', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    deleteServer(document, { index: 0 })

    expect(document.servers).toHaveLength(0)
  })

  it('no-ops when deleting from null document', () => {
    expect(() => deleteServer(null, { index: 0 })).not.toThrow()
  })

  it('no-ops when deleting with out-of-bounds index', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    deleteServer(document, { index: 10 })

    // servers array should remain unchanged
    expect(document.servers).toHaveLength(1)
  })
})

describe('updateServerVariables', () => {
  it('updates a server variable default value', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
          },
        },
      ],
    })

    const result = updateServerVariables(document, {
      index: 0,
      key: 'environment',
      value: 'staging',
    })

    expect(result).toBeDefined()
    expect(result?.default).toBe('staging')
    expect(document.servers?.[0]?.variables?.environment?.default).toBe('staging')
    expect(document.servers?.[0]?.variables?.environment?.enum).toEqual(['api', 'dev', 'staging'])
  })

  it('updates multiple variables independently', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com:{port}',
          variables: {
            environment: {
              default: 'api',
            },
            port: {
              default: '443',
            },
          },
        },
      ],
    })

    updateServerVariables(document, {
      index: 0,
      key: 'environment',
      value: 'dev',
    })

    updateServerVariables(document, {
      index: 0,
      key: 'port',
      value: '8080',
    })

    expect(document.servers?.[0]?.variables?.environment?.default).toBe('dev')
    expect(document.servers?.[0]?.variables?.port?.default).toBe('8080')
  })

  it('returns undefined when variable does not exist', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://api.example.com',
          variables: {},
        },
      ],
    })

    const result = updateServerVariables(document, {
      index: 0,
      key: 'nonexistent',
      value: 'value',
    })

    expect(result).toBeUndefined()
  })

  it('returns undefined when server has no variables object', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://api.example.com',
        },
      ],
    })

    const result = updateServerVariables(document, {
      index: 0,
      key: 'environment',
      value: 'dev',
    })

    expect(result).toBeUndefined()
  })

  it('returns undefined when server at index does not exist', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    const result = updateServerVariables(document, {
      index: 5,
      key: 'environment',
      value: 'dev',
    })

    expect(result).toBeUndefined()
  })
})

describe('syncVariablesForUrlChange', () => {
  it('handles URLs with no variables in either old or new URL', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://api.example.com',
          variables: {},
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://api-v2.example.com',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://api-v2.example.com')
    expect(document.servers?.[0]?.variables).toEqual({})
  })

  it('adds multiple new variables when old URL had no variables', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://api.example.com',
          variables: {},
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://{environment}.example.com:{port}/{version}',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://{environment}.example.com:{port}/{version}')
    expect(document.servers?.[0]?.variables).toEqual({
      environment: {
        default: '',
      },
      port: {
        default: '',
      },
      version: {
        default: '',
      },
    })
  })

  it('removes multiple variables when new URL has no variables', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com:{port}/{version}',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
            port: {
              default: '443',
              enum: ['443', '8080'],
            },
            version: {
              default: 'v1',
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://api.example.com',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://api.example.com')
    expect(document.servers?.[0]?.variables).toEqual({})
  })

  it('preserves variables when they are reordered in the URL', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com/{version}',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev'],
            },
            version: {
              default: 'v1',
              enum: ['v1', 'v2'],
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://{version}.example.com/{environment}',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://{version}.example.com/{environment}')
    expect(document.servers?.[0]?.variables).toEqual({
      version: {
        default: 'v1',
        enum: ['v1', 'v2'],
      },
      environment: {
        default: 'api',
        enum: ['api', 'dev'],
      },
    })
  })

  it('handles mix of preserved and new variables with complex configs', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com/{version}',
          variables: {
            environment: {
              default: 'production',
              enum: ['production', 'staging', 'development'],
              description: 'The deployment environment',
            },
            version: {
              default: 'v2',
              enum: ['v1', 'v2', 'v3'],
            },
          },
        },
      ],
    })

    updateServer(document, {
      index: 0,
      server: {
        url: 'https://{environment}.example.com/{version}/{region}',
      },
    })

    expect(document.servers?.[0]?.url).toBe('https://{environment}.example.com/{version}/{region}')
    expect(document.servers?.[0]?.variables).toEqual({
      environment: {
        default: 'production',
        enum: ['production', 'staging', 'development'],
        description: 'The deployment environment',
      },
      version: {
        default: 'v2',
        enum: ['v1', 'v2', 'v3'],
      },
      region: {
        default: '',
      },
    })
  })
})

describe('updateSelectedServer', () => {
  it('updates the selected server by url', () => {
    const document = createDocument({
      servers: [
        { url: 'https://api.example.com' },
        { url: 'https://dev.example.com' },
        { url: 'https://staging.example.com' },
      ],
    })

    const result = updateSelectedServer(document, { url: 'https://dev.example.com' })

    expect(result).toBe('https://dev.example.com')
    expect(document['x-scalar-selected-server']).toBe('https://dev.example.com')
  })

  it('updates the selected server to the first server', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }, { url: 'https://dev.example.com' }],
      'x-scalar-selected-server': 'https://dev.example.com',
    })

    const result = updateSelectedServer(document, { url: 'https://api.example.com' })

    expect(result).toBe('https://api.example.com')
    expect(document['x-scalar-selected-server']).toBe('https://api.example.com')
  })

  it('allows setting a server URL that does not exist in the servers array as it may be from the config', () => {
    const document = createDocument({
      servers: [{ url: 'https://api.example.com' }],
    })

    const result = updateSelectedServer(document, { url: 'https://custom.example.com' })

    expect(result).toBe('https://custom.example.com')
    expect(document['x-scalar-selected-server']).toBe('https://custom.example.com')
  })

  it('handles selecting a server with variables', () => {
    const document = createDocument({
      servers: [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'dev', 'staging'],
            },
          },
        },
      ],
    })

    const result = updateSelectedServer(document, { url: 'https://{environment}.example.com' })

    expect(result).toBe('https://{environment}.example.com')
    expect(document['x-scalar-selected-server']).toBe('https://{environment}.example.com')
  })
})

describe('x-scalar-selected-server tracking', () => {
  describe('when updating server URL', () => {
    it('updates x-scalar-selected-server when the selected server URL changes', () => {
      const document = createDocument({
        servers: [{ url: 'https://api.example.com' }, { url: 'https://dev.example.com' }],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      updateServer(document, {
        index: 0,
        server: { url: 'https://api-v2.example.com' },
      })

      expect(document.servers?.[0]?.url).toBe('https://api-v2.example.com')
      expect(document['x-scalar-selected-server']).toBe('https://api-v2.example.com')
    })

    it('does not update x-scalar-selected-server when a non-selected server URL changes', () => {
      const document = createDocument({
        servers: [{ url: 'https://api.example.com' }, { url: 'https://dev.example.com' }],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      updateServer(document, {
        index: 1,
        server: { url: 'https://dev-v2.example.com' },
      })

      expect(document.servers?.[1]?.url).toBe('https://dev-v2.example.com')
      expect(document['x-scalar-selected-server']).toBe('https://api.example.com')
    })

    it('does not update x-scalar-selected-server when URL does not change', () => {
      const document = createDocument({
        servers: [{ url: 'https://api.example.com' }],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      updateServer(document, {
        index: 0,
        server: { description: 'Updated description' },
      })

      expect(document['x-scalar-selected-server']).toBe('https://api.example.com')
    })

    it('updates x-scalar-selected-server when selected server URL changes with variables', () => {
      const document = createDocument({
        servers: [
          {
            url: 'https://{environment}.example.com',
            variables: {
              environment: {
                default: 'api',
                enum: ['api', 'dev'],
              },
            },
          },
        ],
        'x-scalar-selected-server': 'https://{environment}.example.com',
      })

      updateServer(document, {
        index: 0,
        server: { url: 'https://{env}.example.com/{version}' },
      })

      expect(document.servers?.[0]?.url).toBe('https://{env}.example.com/{version}')
      expect(document['x-scalar-selected-server']).toBe('https://{env}.example.com/{version}')
    })

    it('does not crash when x-scalar-selected-server is undefined', () => {
      const document = createDocument({
        servers: [{ url: 'https://api.example.com' }],
      })

      updateServer(document, {
        index: 0,
        server: { url: 'https://api-v2.example.com' },
      })

      expect(document.servers?.[0]?.url).toBe('https://api-v2.example.com')
      expect(document['x-scalar-selected-server']).toBeUndefined()
    })
  })

  describe('when deleting server', () => {
    it('sets x-scalar-selected-server to first remaining server when selected server is deleted', () => {
      const document = createDocument({
        servers: [
          { url: 'https://api.example.com' },
          { url: 'https://dev.example.com' },
          { url: 'https://staging.example.com' },
        ],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      deleteServer(document, { index: 0 })

      expect(document.servers).toHaveLength(2)
      expect(document['x-scalar-selected-server']).toBe('https://dev.example.com')
    })

    it('sets x-scalar-selected-server to undefined when last server is deleted', () => {
      const document = createDocument({
        servers: [{ url: 'https://api.example.com' }],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      deleteServer(document, { index: 0 })

      expect(document.servers).toHaveLength(0)
      expect(document['x-scalar-selected-server']).toBeUndefined()
    })

    it('does not update x-scalar-selected-server when a non-selected server is deleted', () => {
      const document = createDocument({
        servers: [
          { url: 'https://api.example.com' },
          { url: 'https://dev.example.com' },
          { url: 'https://staging.example.com' },
        ],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      deleteServer(document, { index: 1 })

      expect(document.servers).toHaveLength(2)
      expect(document['x-scalar-selected-server']).toBe('https://api.example.com')
    })

    it('sets x-scalar-selected-server correctly when middle server is selected and deleted', () => {
      const document = createDocument({
        servers: [
          { url: 'https://api.example.com' },
          { url: 'https://dev.example.com' },
          { url: 'https://staging.example.com' },
        ],
        'x-scalar-selected-server': 'https://dev.example.com',
      })

      deleteServer(document, { index: 1 })

      expect(document.servers).toHaveLength(2)
      expect(document.servers?.[0]?.url).toBe('https://api.example.com')
      expect(document.servers?.[1]?.url).toBe('https://staging.example.com')
      expect(document['x-scalar-selected-server']).toBe('https://api.example.com')
    })

    it('does not crash when x-scalar-selected-server is undefined', () => {
      const document = createDocument({
        servers: [{ url: 'https://api.example.com' }, { url: 'https://dev.example.com' }],
      })

      deleteServer(document, { index: 0 })

      expect(document.servers).toHaveLength(1)
      expect(document['x-scalar-selected-server']).toBeUndefined()
    })

    it('handles deleting server with variables', () => {
      const document = createDocument({
        servers: [
          {
            url: 'https://{environment}.example.com',
            variables: {
              environment: {
                default: 'api',
                enum: ['api', 'dev'],
              },
            },
          },
          { url: 'https://backup.example.com' },
        ],
        'x-scalar-selected-server': 'https://{environment}.example.com',
      })

      deleteServer(document, { index: 0 })

      expect(document.servers).toHaveLength(1)
      expect(document['x-scalar-selected-server']).toBe('https://backup.example.com')
    })

    it('sets x-scalar-selected-server to undefined when deleting from an empty document', () => {
      const document = createDocument({
        servers: [],
        'x-scalar-selected-server': 'https://api.example.com',
      })

      deleteServer(document, { index: 0 })

      expect(document.servers).toHaveLength(0)
      expect(document['x-scalar-selected-server']).toBe('https://api.example.com')
    })
  })
})
