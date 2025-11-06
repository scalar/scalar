import { describe, expect, it } from 'vitest'

import type { WorkspaceDocument } from '@/schemas'

import { addServer, deleteServer, updateServer, updateServerVariables } from './server'

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

  it('detects variables when URL changes and contains path variables', () => {
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

    const result = updateServer(document, {
      index: 0,
      server: {
        url: 'https://{environment}.example.com/{version}',
      },
    })

    expect(result).toBeDefined()
    expect(result?.url).toBe('https://{environment}.example.com/{version}')
    expect(result?.variables).toEqual({ environment: { default: 'api' }, version: { default: 'v1' } })
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
