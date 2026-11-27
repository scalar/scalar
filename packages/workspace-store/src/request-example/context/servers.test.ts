import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteServer, updateSelectedServer } from '@/mutators/server'
import { resolveExecutableRequestUrl } from '@/request-example/builder/build-request'
import { resolveServerUrl } from '@/request-example/builder/helpers/resolve-server-url'
import { requestFactory } from '@/request-example/builder/request-factory'
import type { WorkspaceDocument } from '@/schemas'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'
import type { OperationObject } from '@/schemas/v3.2/strict/operation'

import { getSelectedServer, getServers } from './servers'

describe('servers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('window', {
      location: {
        origin: 'https://example.com',
      },
    })
  })

  it.each<{
    url: string
    prefix: string
    baseServerUrl?: string
    envVariables?: Record<string, string>
    expected: string
  }>([
    { url: '{prefix}/v2', prefix: '', expected: 'https://api.example.com/v2/planets' },
    { url: '{prefix}', prefix: '', expected: 'https://api.example.com/docs/planets' },
    { url: '{prefix}', prefix: 'release.v1', expected: 'https://api.example.com/docs/release.v1/planets' },
    {
      url: '{prefix}/v2',
      prefix: '',
      baseServerUrl: 'https://proxy.example.com/api',
      expected: 'https://proxy.example.com/api/v2/planets',
    },
    {
      url: '{prefix}',
      prefix: '',
      baseServerUrl: 'https://proxy.example.com/api',
      expected: 'https://proxy.example.com/api/planets',
    },
    {
      url: '{prefix}',
      prefix: 'https://absolute.example.com/v1',
      baseServerUrl: 'https://proxy.example.com/api',
      expected: 'https://absolute.example.com/v1/planets',
    },
    {
      url: '{prefix}/v2/{{tenant}}',
      prefix: '',
      envVariables: { tenant: 'tenant01' },
      expected: 'https://api.example.com/v2/tenant01/planets',
    },
    {
      url: '{prefix}/v2/{{tenant}}',
      prefix: '',
      baseServerUrl: 'https://proxy.example.com/api',
      envVariables: { tenant: 'tenant01' },
      expected: 'https://proxy.example.com/api/v2/tenant01/planets',
    },
    {
      url: '{prefix}/{{tenant}}',
      prefix: 'release.v1',
      envVariables: { tenant: 'tenant01' },
      expected: 'https://api.example.com/docs/release.v1/tenant01/planets',
    },
    {
      url: '{prefix}/{{tenant}}',
      prefix: '//cdn.example.com',
      baseServerUrl: 'https://proxy.example.com/api',
      envVariables: { tenant: 'tenant01' },
      expected: 'https://cdn.example.com/tenant01/planets',
    },
    {
      url: '{prefix}{{host}}/v2',
      prefix: '//',
      envVariables: { host: 'cdn.example.com' },
      expected: 'https://cdn.example.com/v2/planets',
    },
    {
      url: '{prefix}{{origin}}/v2',
      prefix: '',
      envVariables: { origin: 'https://absolute.example.com' },
      expected: 'https://absolute.example.com/v2/planets',
    },
  ])(
    'builds the request to $expected for $url with prefix $prefix',
    ({ url, prefix, baseServerUrl, envVariables, expected }) => {
      const servers = getServers([{ url, variables: { prefix: { default: prefix } } }], {
        baseServerUrl,
        documentUrl: 'https://api.example.com/docs/openapi.json',
      })
      const { request } = requestFactory({
        defaultHeaders: {},
        environment: { color: '#FFFFFF', variables: [] },
        exampleName: 'default',
        globalCookies: [],
        isElectron: false,
        method: 'get',
        operation: { responses: {} },
        path: '/planets',
        proxyUrl: '',
        selectedSecuritySchemes: [],
        server: getSelectedServer(null, null, null, servers),
      })

      expect(resolveExecutableRequestUrl(request, envVariables ?? {}, { allowMissingRequestServerBase: false })).toBe(
        expected,
      )
    },
  )

  it('preserves schemeless hosts when only the browser origin is available', () => {
    const [server] = getServers([{ url: '{host}', variables: { host: { default: 'api.example.com' } } }])

    expect(resolveServerUrl(server ?? null)).toBe('api.example.com')
  })

  it.each<{ server: ServerObject; expectedPath: string }>([
    {
      server: { url: '{host}/v1', variables: { host: { default: 'api.example.com' } } },
      expectedPath: 'api.example.com/v1',
    },
    {
      server: { url: '{host}:8080/v1', variables: { host: { default: 'api.example.com' } } },
      expectedPath: 'api.example.com:8080/v1',
    },
    {
      server: { url: 'api.example.com:{port}/v1', variables: { port: { default: '8080' } } },
      expectedPath: 'api.example.com:8080/v1',
    },
    { server: { url: 'api.example.com/v1' }, expectedPath: 'api.example.com/v1' },
    { server: { url: 'api.example.com:8080/v1' }, expectedPath: 'api.example.com:8080/v1' },
  ])('resolves $server.url as a path when a document or configured base is available', ({ server, expectedPath }) => {
    const documentUrl = 'https://docs.example.com/specs/openapi.json'
    const [documentServer] = getServers([server], { documentUrl })
    const [configuredServer] = getServers([server], { documentUrl, baseServerUrl: 'https://proxy.example.com/api' })

    expect(resolveServerUrl(documentServer ?? null)).toBe(`https://docs.example.com/specs/${expectedPath}`)
    expect(resolveServerUrl(configuredServer ?? null)).toBe(`https://proxy.example.com/api/${expectedPath}`)
  })

  it('resolves literal relative paths and explicit network hosts', () => {
    const servers = getServers([{ url: 'v2' }, { url: '../api' }, { url: '//api.example.com:8080/v2' }], {
      documentUrl: 'https://docs.example.com/specs/openapi.json',
    })

    expect(servers.map(resolveServerUrl)).toStrictEqual([
      'https://docs.example.com/specs/v2',
      'https://docs.example.com/api',
      'https://api.example.com:8080/v2',
    ])
  })

  it('uses only the configured base for dotted paths in inline descriptions', () => {
    const [server] = getServers([{ url: '{prefix}', variables: { prefix: { default: 'release.v1' } } }], {
      baseServerUrl: 'https://api.example.com/base',
    })

    expect(resolveServerUrl(server ?? null)).toBe('https://api.example.com/base/release.v1')
  })

  it.each(['about:blank', 'file:///docs/openapi.json', 'ftp://docs.example.com/openapi.json'])(
    'falls back to the browser origin for a description at %s',
    (documentUrl) => {
      const [server] = getServers([{ url: '{prefix}/v2', variables: { prefix: { default: '' } } }], {
        documentUrl,
      })

      expect(resolveServerUrl(server ?? null)).toBe('https://example.com/v2')
    },
  )

  it('excludes document credentials from rooted and templated server URLs', () => {
    const servers = getServers(
      [{ url: '/v2' }, { url: '{prefix}', variables: { prefix: { default: 'release.v1' } } }],
      { documentUrl: 'https://test-user:test-password@api.example.com/docs/openapi.json' },
    )

    expect(servers.map(resolveServerUrl)).toStrictEqual([
      'https://api.example.com/v2',
      'https://api.example.com/docs/release.v1',
    ])
  })

  it('selects the remaining server after deleting a selected root-relative server', () => {
    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1' },
      'x-scalar-original-document-hash': '',
      servers: [{ url: 'https://other.example.com' }, { url: '/v2' }],
    }
    const options = { documentUrl: 'https://api.example.com/docs/openapi.json' }
    const selected = getServers(document.servers, options)[1]
    assert(selected)
    updateSelectedServer(document, { url: selected.url, meta: { type: 'document' } })
    deleteServer(document, { index: 1, meta: { type: 'document' } })

    expect(getSelectedServer(document, null, null, getServers(document.servers, options))?.url).toBe(
      'https://other.example.com',
    )
  })

  describe('getServers', () => {
    it('returns empty array when no servers provided', () => {
      vi.stubGlobal('window', undefined)

      const result = getServers(undefined)
      expect(result).toEqual([])
    })

    it('returns empty array when undefined servers provided (no fallback)', () => {
      const result = getServers(undefined)
      expect(result).toEqual([])
    })

    it('returns empty array when empty servers array provided (no fallback)', () => {
      const result = getServers([])
      expect(result).toEqual([])
    })

    it('handles invalid servers array (non-array)', () => {
      const result = getServers('invalid' as any)

      expect(result).toHaveLength(0)
    })

    it('processes valid server objects', () => {
      const servers: ServerObject[] = [
        {
          url: 'https://api.example.com',
          description: 'Production API',
        },
        {
          url: 'https://staging-api.example.com',
          description: 'Staging API',
        },
      ]

      const result = getServers(servers)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        url: 'https://api.example.com',
        description: 'Production API',
      })
      expect(result[1]).toMatchObject({
        url: 'https://staging-api.example.com',
        description: 'Staging API',
      })
    })

    it('resolves relative URLs using baseServerURL', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }, { url: '/api/v2' }]

      const result = getServers(servers, {
        baseServerUrl: 'https://api.example.com',
      })

      expect(result).toHaveLength(2)
      expect(result[0]?.url).toBe('https://api.example.com/api/v1')
      expect(result[1]?.url).toBe('https://api.example.com/api/v2')
    })

    it('resolves relative URLs using document URL when baseServerURL not provided', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }]

      const result = getServers(servers, {
        documentUrl: 'https://docs.example.com/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://docs.example.com/api/v1')
    })

    it('resolves relative URLs using window.location.origin when no other base URL available', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }]

      const result = getServers(servers)

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://example.com/api/v1')
    })

    it('leaves absolute URLs unchanged', () => {
      const servers: ServerObject[] = [{ url: 'https://api.example.com/v1' }, { url: 'http://localhost:3000' }]

      const result = getServers(servers)

      expect(result).toHaveLength(2)
      expect(result[0]?.url).toBe('https://api.example.com/v1')
      expect(result[1]?.url).toBe('http://localhost:3000')
    })

    it('handles servers with variables', () => {
      const servers: ServerObject[] = [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'staging', 'dev'],
            },
          },
        },
      ]

      const result = getServers(servers)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://{environment}.example.com',
        variables: {
          environment: {
            default: 'api',
            enum: ['api', 'staging', 'dev'],
          },
        },
      })
    })

    it('returns empty array when document URL provided but no servers', () => {
      const result = getServers(undefined, {
        documentUrl: 'https://api.example.com:8080/docs/openapi.json',
      })

      expect(result).toEqual([])
    })

    it('returns empty array when invalid document URL provided and no servers', () => {
      const result = getServers(undefined, {
        documentUrl: 'invalid-url',
      })

      expect(result).toEqual([])
    })

    it('returns empty array when protocol-relative document URL provided and no servers', () => {
      const result = getServers(undefined, {
        documentUrl: '//api.example.com/docs/openapi.json',
      })

      expect(result).toEqual([])
    })

    it('combines multiple base URL resolution strategies', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }, { url: '/api/v2' }]

      const result = getServers(servers, {
        baseServerUrl: 'https://base.example.com',
        documentUrl: 'https://docs.example.com/openapi.json',
      })

      // Should use baseServerURL (highest priority)
      expect(result).toHaveLength(2)
      expect(result[0]?.url).toBe('https://base.example.com/api/v1')
      expect(result[1]?.url).toBe('https://base.example.com/api/v2')
    })

    it('handles servers with complex URL patterns', () => {
      const servers: ServerObject[] = [
        { url: 'https://api.example.com/v1/users' },
        { url: 'https://api.example.com/v1/posts' },
        { url: '/v1/comments' },
      ]

      const result = getServers(servers, {
        baseServerUrl: 'https://api.example.com',
      })

      expect(result).toHaveLength(3)
      expect(result[0]?.url).toBe('https://api.example.com/v1/users')
      expect(result[1]?.url).toBe('https://api.example.com/v1/posts')
      expect(result[2]?.url).toBe('https://api.example.com/v1/comments')
    })

    it('preserves server descriptions and metadata', () => {
      const servers: ServerObject[] = [
        {
          url: 'https://api.example.com',
          description: 'Production API server',
        },
      ]

      const result = getServers(servers)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://api.example.com',
        description: 'Production API server',
      })
    })

    it('returns empty array for null servers (no fallback)', () => {
      // @ts-expect-error testing null value
      const result = getServers(null)

      expect(result).toEqual([])
    })

    it('does not create a fallback server even when window.location.origin is available', () => {
      const result = getServers(undefined)

      expect(result).toEqual([])
    })

    it('does not create a fallback server from documentUrl when no servers provided', () => {
      const result = getServers(undefined, {
        documentUrl: 'https://api.example.com/openapi.json',
      })

      expect(result).toEqual([])
    })

    it('still resolves relative server URLs when servers are provided', () => {
      const servers: ServerObject[] = [{ url: '/api/v2' }]

      const result = getServers(servers, {
        documentUrl: 'https://api.example.com/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://api.example.com/api/v2')
    })
  })

  describe('getSelectedServer', () => {
    const servers: ServerObject[] = [
      { url: 'https://api.example.com' },
      { url: 'https://staging.example.com' },
      { url: 'https://dev.example.com' },
    ]

    const minimalOasDocument = (overrides: Record<string, unknown>) =>
      ({
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        ...overrides,
      }) as unknown as WorkspaceDocument

    it('returns the server matching document x-scalar-selected-server when configServers is set', () => {
      const document = minimalOasDocument({
        'x-scalar-selected-server': 'https://staging.example.com',
      })

      const result = getSelectedServer(document, null, [], servers)

      expect(result).toEqual({ url: 'https://staging.example.com' })
    })

    it('returns the server matching document x-scalar-selected-server when configServers is null', () => {
      const document = minimalOasDocument({ 'x-scalar-selected-server': 'https://staging.example.com' })

      const result = getSelectedServer(document, null, null, servers)

      expect(result).toEqual({ url: 'https://staging.example.com' })
    })

    it('returns the server matching operation x-scalar-selected-server when configServers is null', () => {
      const operation = { 'x-scalar-selected-server': 'https://dev.example.com' }

      const result = getSelectedServer(null, operation as OperationObject, null, servers)

      expect(result).toEqual({ url: 'https://dev.example.com' })
    })

    it('prefers operation x-scalar-selected-server over document when configServers is null', () => {
      const document = minimalOasDocument({ 'x-scalar-selected-server': 'https://api.example.com' })
      const operation = { 'x-scalar-selected-server': 'https://staging.example.com' }

      const result = getSelectedServer(document, operation as OperationObject, null, servers)

      expect(result).toEqual({ url: 'https://staging.example.com' })
    })

    it('ignores operation x-scalar-selected-server when configServers is non-null', () => {
      const document = minimalOasDocument({ 'x-scalar-selected-server': 'https://api.example.com' })
      const operation = { 'x-scalar-selected-server': 'https://dev.example.com' }

      const result = getSelectedServer(document, operation as OperationObject, [{} as ServerObject], servers)

      expect(result).toEqual({ url: 'https://api.example.com' })
    })

    it('returns null when selected URL does not match any server URL', () => {
      const document = minimalOasDocument({ 'x-scalar-selected-server': 'https://nonexistent.example.com' })

      const result = getSelectedServer(document, null, null, servers)

      expect(result).toBeNull()
    })

    it('returns null when servers list is empty and selection is unset', () => {
      const result = getSelectedServer(null, null, null, [])

      expect(result).toBeNull()
    })

    it('returns first server when no x-scalar-selected-server is set', () => {
      const result = getSelectedServer(null, null, null, servers)

      expect(result).toEqual({ url: 'https://api.example.com' })
    })

    it('returns null when x-scalar-selected-server is empty string (user un-selected)', () => {
      const document = minimalOasDocument({ 'x-scalar-selected-server': '' })

      const result = getSelectedServer(document, null, null, [{ url: 'https://api.example.com' }])

      expect(result).toBeNull()
    })
  })
})
