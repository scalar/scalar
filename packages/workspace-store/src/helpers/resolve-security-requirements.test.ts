import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { type LoaderPlugin, bundle } from '@scalar/json-magic/bundle'
import { getHash } from '@scalar/json-magic/bundle/value-generator'
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

  it('preserves separate scopes for equivalent URI keys in a referenced operation', async () => {
    const authored = { get: { security: [{ './auth': ['read'], auth: ['write'] }] } }
    const document: Record<string, unknown> = {
      openapi: '3.2.1',
      paths: { '/test': { $ref: './path.json' } },
    }
    const loaders = [
      documentLoader({
        'https://example.com/api/path.json': authored,
        'https://example.com/api/auth': bearer,
      }),
    ]
    await bundle(document, { origin, plugins: [openApiDocument(), ...loaders], treeShake: false, urlMap: true })
    await resolveSecurityRequirements(document, { origin, loaders })
    const proxy = createMagicProxy(document) as OpenApiDocument
    const security = getResolvedRef(getResolvedRef(proxy.paths?.['/test'])?.get)?.security
    expect(Object.values(security?.[0] ?? {})).toStrictEqual([['read'], ['write']])
    restoreSecurityRequirements(document)
    expect(getResolvedRef((createMagicProxy(document) as OpenApiDocument).paths?.['/test'])).toStrictEqual(authored)
  })

  it.each(['client', 'static', 'ssr'] as const)(
    'loads external OAuth without an optional refresh URL in %s',
    async (mode) => {
      const directory = await mkdtemp(join(tmpdir(), 'scalar-security-uri-'))
      const auth = {
        openapi: '3.2.1',
        components: {
          securitySchemes: {
            OAuth: {
              type: 'oauth2',
              flows: { implicit: { authorizationUrl: 'https://example.com/oauth', scopes: { read: 'Read' } } },
            },
          },
        },
      }
      try {
        const authFile = join(directory, 'auth.json')
        await writeFile(authFile, JSON.stringify(auth))
        const key = `${mode === 'client' ? 'https://example.com/auth.json' : authFile}#/components/securitySchemes/OAuth`
        const document = {
          openapi: '3.2.1',
          info: { title: 'OAuth URI', version: '1' },
          paths: {},
          security: [{ [key]: ['read'] }],
        }
        if (mode === 'client') {
          const store = createWorkspaceStore({ fetch: () => Promise.resolve(new Response(JSON.stringify(auth))) })
          await store.addDocument({ name: 'api', document })
          const scheme = getResolvedRef(
            (store.workspace.documents.api as OpenApiDocument).components?.securitySchemes?.[key],
          )
          expect(scheme).toStrictEqual({
            type: 'oauth2',
            flows: { implicit: { ...auth.components.securitySchemes.OAuth.flows.implicit, refreshUrl: '' } },
          })
        } else {
          const server = await createServerWorkspaceStore({
            mode,
            baseUrl: 'https://scalar.example.com',
            documents: [{ name: 'api', document }],
          })
          const alias = server.get(`#/api/components/securitySchemes/${escapeJsonPointer(key)}`)
          expect(alias).toStrictEqual({
            $ref: `#/x-ext/${getHash(relative('/', authFile))}/components/securitySchemes/OAuth`,
          })
          const proxy = createMagicProxy({
            ...server.getWorkspace().documents.api,
            components: { securitySchemes: { [key]: alias } },
          }) as OpenApiDocument
          expect(getResolvedRef(proxy.components?.securitySchemes?.[key])).toStrictEqual(
            auth.components.securitySchemes.OAuth,
          )
        }
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    },
  )

  it('does not restore through inherited document paths', () => {
    const inherited = { security: [{ runtime: ['read'] }], components: { securitySchemes: { runtime: bearer } } }
    const document: Record<string, unknown> = Object.assign(Object.create(inherited), {
      'x-scalar-original-security-keys': { '["security","0"]': { authored: 'runtime' } },
      'x-scalar-security-uri-aliases': { schemes: { runtime: 'https://example.com/auth' } },
    })
    const original = structuredClone(inherited)
    restoreSecurityRequirements(document)
    expect(inherited).toStrictEqual(original)
  })

  it('normalizes HTTP scheme casing in a URI-only dependency', async () => {
    const document = { openapi: '3.2.1', security: [{ './auth': [] }] }
    await resolveSecurityRequirements(document, {
      origin,
      loaders: [documentLoader({ 'https://example.com/api/auth': { type: 'http', scheme: 'Bearer' } })],
    })
    expect(schemeAt(document, './auth')).toStrictEqual(bearer)
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
      expect(server.get(`#/api/components/securitySchemes/${escapeJsonPointer(key)}`)).toStrictEqual({
        $ref: '#/components/securitySchemes/Bearer',
      })
      const sparse = server.getWorkspace().documents.api as OpenApiDocument
      const reference = sparse.components?.securitySchemes?.[key]
      if (mode === 'ssr') {
        const uri = `https://scalar.example.com/api/components/securitySchemes/${encodeURIComponent(escapeJsonPointer(key))}#`
        expect(reference).toStrictEqual({ $ref: uri, $global: true })
        expect(server.get(uri)).toStrictEqual({ $ref: '#/components/securitySchemes/Bearer' })
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
