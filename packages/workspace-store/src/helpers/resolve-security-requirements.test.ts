import { type LoaderPlugin, bundle } from '@scalar/json-magic/bundle'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { createAuthStore } from '@/entities/auth'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { openApiDocument } from '@/plugins/bundler/openapi-document'
import { buildRequestSecurity } from '@/request-example/builder/security/build-request-security'
import { getSecuritySchemes } from '@/request-example/context/security/get-security-schemes'
import { mergeSecurity } from '@/request-example/context/security/merge-security'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'
import { createServerWorkspaceStore } from '@/server'

import { resolveSecurityRequirements, restoreSecurityRequirements } from './resolve-security-requirements'

const bearer = { type: 'http' as const, scheme: 'bearer' as const }
const apiKey = { type: 'apiKey' as const, in: 'header' as const, name: 'X-API-Key' }
const origin = 'https://example.com/api/openapi.json'

/** An in-memory document loader exercises the same loading contract as file and HTTP loaders. */
const documentLoader = (documents: Record<string, unknown>): LoaderPlugin => ({
  type: 'loader',
  validate: (uri) => Object.hasOwn(documents, uri),
  exec: (uri) =>
    Promise.resolve({ ok: true, data: structuredClone(documents[uri]), raw: JSON.stringify(documents[uri]) }),
})

const schemeAt = (document: Record<string, unknown>, key: string): unknown => {
  const proxy = createMagicProxy(document) as OpenApiDocument
  return getResolvedRef(proxy.components?.securitySchemes?.[key])
}

describe('resolve-security-requirements', () => {
  it.each(['#/components/securitySchemes/Bearer', `${origin}#/components/securitySchemes/Bearer`])(
    'resolves %s without changing the authored requirement',
    async (key) => {
      const document = {
        openapi: '3.2.1',
        security: [{ [key]: [] }],
        components: { securitySchemes: { Bearer: bearer } },
      }
      const original = structuredClone(document)
      await resolveSecurityRequirements(document, { origin, loaders: [] })
      expect(schemeAt(document, key)).toStrictEqual(bearer)
      expect(document.security).toStrictEqual(original.security)
      restoreSecurityRequirements(document)
      delete (document as Record<string, unknown>)['x-ext-urls']
      expect(document).toStrictEqual(original)
    },
  )

  it('prefers exact component names and permits an explicit relative URI', async () => {
    const document = {
      openapi: '3.2.1',
      security: [{ auth: [] }, { './auth': [] }],
      components: { securitySchemes: { auth: apiKey } },
    }
    await resolveSecurityRequirements(document, {
      origin,
      loaders: [documentLoader({ 'https://example.com/api/auth': bearer })],
    })
    expect(schemeAt(document, 'auth')).toStrictEqual(apiKey)
    expect(schemeAt(document, './auth')).toStrictEqual(bearer)
  })

  it('uses a relative $self before the retrieval URI', async () => {
    const document = {
      openapi: '3.2.1',
      $self: '../canonical/api.json',
      security: [{ './auth.json#/components/securitySchemes/key': [] }],
    }
    await resolveSecurityRequirements(document, {
      origin,
      loaders: [
        documentLoader({
          'https://example.com/canonical/auth.json': {
            openapi: '3.2.1',
            components: { securitySchemes: { key: apiKey } },
          },
        }),
      ],
    })
    expect(schemeAt(document, './auth.json#/components/securitySchemes/key')).toStrictEqual(apiKey)
  })

  it('keeps relative keys from different referenced documents separate', async () => {
    const document: Record<string, unknown> = {
      openapi: '3.2.1',
      paths: {
        '/a': { $ref: './a/api.json#/paths/~1test' },
        '/b': { $ref: './b/api.json#/paths/~1test' },
      },
    }
    const loaders = [
      documentLoader({
        'https://example.com/api/a/api.json': {
          openapi: '3.2.1',
          paths: { '/test': { get: { security: [{ './auth.json': ['read'] }] } } },
        },
        'https://example.com/api/b/api.json': {
          openapi: '3.2.1',
          paths: { '/test': { get: { security: [{ './auth.json': [] }] } } },
        },
        'https://example.com/api/a/auth.json': bearer,
        'https://example.com/api/b/auth.json': apiKey,
      }),
    ]
    await bundle(document, { origin, plugins: [openApiDocument(), ...loaders], treeShake: false, urlMap: true })
    await resolveSecurityRequirements(document, { origin, loaders })
    const proxy = createMagicProxy(document) as OpenApiDocument
    const a = getResolvedRef(getResolvedRef(proxy.paths?.['/a'])?.get)?.security
    const b = getResolvedRef(getResolvedRef(proxy.paths?.['/b'])?.get)?.security
    expect(a).toStrictEqual([{ 'https://example.com/api/a/auth.json': ['read'] }])
    expect(b).toStrictEqual([{ 'https://example.com/api/b/auth.json': [] }])
    expect(schemeAt(document, 'https://example.com/api/a/auth.json')).toStrictEqual(bearer)
    expect(schemeAt(document, 'https://example.com/api/b/auth.json')).toStrictEqual(apiKey)
    restoreSecurityRequirements(document)
    expect(
      getResolvedRef(getResolvedRef((createMagicProxy(document) as OpenApiDocument).paths?.['/a'])?.get)?.security,
    ).toStrictEqual([{ './auth.json': ['read'] }])
  })

  it('applies stored credentials to a URI-selected scheme', async () => {
    const key = '#/components/securitySchemes/Bearer'
    const document = {
      openapi: '3.2.1',
      info: { title: 'URI auth', version: '1' },
      security: [{ [key]: [] }],
      components: { securitySchemes: { Bearer: bearer } },
    }
    await resolveSecurityRequirements(document, { origin, loaders: [] })
    const auth = createAuthStore()
    auth.setAuthSecrets('api', key, { type: 'http', 'x-scalar-secret-token': 'token' })
    const proxy = createMagicProxy(document)
    const schemes = mergeSecurity(proxy.components?.securitySchemes, {}, auth, 'api')
    const selected = getSecuritySchemes(schemes, document.security[0] ?? {})
    expect(buildRequestSecurity(selected)).toStrictEqual([
      { in: 'header', name: 'Authorization', value: 'token', format: 'bearer' },
    ])
  })

  it('loads URI auth through the client store and exports the authored document after saving', async () => {
    const key = '#/components/securitySchemes/Bearer'
    const document = {
      openapi: '3.2.1',
      info: { title: 'URI auth', version: '1' },
      paths: {},
      security: [{ [key]: [] }],
      components: { securitySchemes: { Bearer: bearer } },
    }
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'api', document })
    const loaded = store.workspace.documents.api as OpenApiDocument
    expect(getResolvedRef(loaded.components?.securitySchemes?.[key])).toStrictEqual(bearer)
    await store.saveDocument('api')
    expect(JSON.parse(store.exportDocument('api', 'json') ?? '')).toStrictEqual({
      ...document,
      'x-scalar-order': ['api/description/introduction'],
    })
  })

  it.each(['static', 'ssr'] as const)(
    'retains URI schemes in %s workspaces without modifying the input',
    async (mode) => {
      const key = '#/components/securitySchemes/Bearer'
      const document = {
        openapi: '3.2.1',
        info: { title: 'URI auth', version: '1' },
        security: [{ [key]: [] }],
        components: { securitySchemes: { Bearer: bearer } },
      }
      const original = structuredClone(document)
      const server = await createServerWorkspaceStore({
        mode,
        baseUrl: 'https://scalar.example.com',
        documents: [{ name: 'api', document }],
      })
      expect(
        server.get(`#/api/components/securitySchemes/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`),
      ).toStrictEqual({ $ref: '#/components/securitySchemes/Bearer' })
      const sparse = server.getWorkspace().documents.api as OpenApiDocument
      const reference = sparse.components?.securitySchemes?.[key]
      if (mode === 'ssr' && reference && '$ref' in reference) {
        expect(server.get(reference.$ref)).toStrictEqual({ $ref: '#/components/securitySchemes/Bearer' })
      }
      expect(document).toStrictEqual(original)
    },
  )

  it.each(['3.0.4', '3.1.2'])('does not interpret URI keys in OpenAPI %s', async (openapi) => {
    const document = {
      openapi,
      security: [{ '#/components/securitySchemes/Bearer': [] }],
      components: { securitySchemes: { Bearer: bearer } },
    }
    const original = structuredClone(document)
    await resolveSecurityRequirements(document, { origin, loaders: [] })
    expect(document).toStrictEqual(original)
  })

  it('keeps optional and unresolved requirements intact and ignores schemas and examples', async () => {
    const document = {
      openapi: '3.2.1',
      security: [{}, { '#/missing': [] }, { '#/info': [] }],
      info: { title: 'API' },
      components: {
        schemas: { Foo: { properties: { get: { security: [{ '#/info': [] }] } } } },
        examples: { Foo: { value: { get: { security: [{ '#/info': [] }] } } } },
      },
    }
    const original = structuredClone(document)
    await resolveSecurityRequirements(document, { origin, loaders: [] })
    delete (document as Record<string, unknown>)['x-ext-urls']
    expect(document).toStrictEqual(original)
  })
})
