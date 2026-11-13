import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { getRaw } from '@scalar/json-magic/magic-proxy'
import { Value } from '@scalar/typebox/value'
import { coerce } from '@scalar/validation'
import { assert, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { type XCodeSample, XCodeSamples, XCodeSamplesSchema } from '@/schemas/extensions/operation/x-code-samples'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'
import { createServerWorkspaceStore } from '@/server'

const makeDocument = (openapi: string, operation: Record<string, unknown>): Record<string, unknown> => ({
  openapi,
  info: { title: 'Code files', version: '1' },
  paths: { '/sample': { get: { responses: { '200': { description: 'OK' } }, ...operation } } },
})

const getSamples = (document: OpenApiDocument | undefined): XCodeSample[] | undefined =>
  getResolvedRef(getPathItemOperation(document?.paths?.['/sample'], 'get'))?.['x-codeSamples']

describe('code-sample-sources', () => {
  it('preserves source references through both validators', () => {
    const value = { 'x-codeSamples': [{ lang: 'python', source: { $ref: './sample.py' } }] }
    expect(coerce(XCodeSamples, value)).toStrictEqual(value)
    expect(Value.Cast(XCodeSamplesSchema, value)).toStrictEqual(value)
    expect(Value.Check(XCodeSamplesSchema, value)).toBe(true)
  })

  it.each(['3.1.0', '3.2.0'])('loads only the agreed code sources as raw text in %s', async (openapi) => {
    const source = '{"$ref":"https://example.test/never.json","literal":true}\r\n'
    const fetched: string[] = []
    const store = createWorkspaceStore({
      fetch: (url) => {
        fetched.push(String(url))
        return Promise.resolve(new Response(source))
      },
    })
    const literal = { $ref: './literal.py', name: 'keep' }
    const document = makeDocument(openapi, {
      'x-codeSamples': [
        { lang: 'json', source: { $ref: './sample.json' } },
        { lang: 'python', source: 'print("inline")\n' },
      ],
      'x-code-samples': [{ lang: 'json', source: { $ref: './sample.json' } }],
      'x-custom-examples': [{ source: literal }],
      'x-other': { 'x-codeSamples': [{ source: literal }] },
      requestBody: { content: { 'application/json': { example: { 'x-codeSamples': [{ source: literal }] } } } },
    })
    await store.addDocument({ name: 'sample', document, documentSource: 'https://example.test/api/openapi.json' })
    const raw = getRaw(store.workspace.documents.sample) as OpenApiDocument
    expect(getSamples(raw)).toStrictEqual([
      { lang: 'json', source },
      { lang: 'python', source: 'print("inline")\n' },
    ])
    const operation = getResolvedRef(getPathItemOperation(raw.paths?.['/sample'], 'get'))
    expect(operation?.['x-code-samples']).toStrictEqual([{ lang: 'json', source }])
    expect(operation?.['x-custom-examples']?.[0]?.source).toStrictEqual(literal)
    expect(fetched).toStrictEqual(['https://example.test/api/sample.json'])
    expect(
      (document.paths as Record<string, { get: Record<string, unknown> }>)['/sample']?.get['x-codeSamples'],
    ).toStrictEqual([
      { lang: 'json', source: { $ref: './sample.json' } },
      { lang: 'python', source: 'print("inline")\n' },
    ])
  })

  it('uses the origin of an external path item', async () => {
    const source = 'def sample():\n    print("hello")\n'
    const resources: Record<string, string> = {
      'https://example.test/paths/sample.json': JSON.stringify({
        get: { 'x-codeSamples': [{ source: { $ref: '../code/sample.py' } }] },
      }),
      'https://example.test/code/sample.py': source,
    }
    const fetched: string[] = []
    const store = createWorkspaceStore({
      fetch: (url) => {
        fetched.push(String(url))
        return Promise.resolve(
          new Response(resources[String(url)] ?? '', { status: String(url) in resources ? 200 : 404 }),
        )
      },
    })
    await store.addDocument({
      name: 'sample',
      documentSource: 'https://example.test/api/openapi.json',
      document: {
        ...makeDocument('3.1.0', {}),
        paths: { '/sample': { $ref: '../paths/sample.json' } },
      },
    })
    expect(getSamples(store.workspace.documents.sample as OpenApiDocument)?.[0]?.source).toBe(source)
    expect(fetched).toStrictEqual(Object.keys(resources))
  })

  it.each([false, true])('loads external fragment sources with a declared identity: %s', async (withIdentity) => {
    const source = 'print("fragment")\n'
    const resources: Record<string, string> = {
      'https://example.test/paths/first.json': JSON.stringify({ item: { $ref: './second.json#/item' } }),
      'https://example.test/paths/second.json': JSON.stringify({
        ...(withIdentity ? { openapi: '3.2.0', $self: 'https://example.test/canonical/paths/second.json' } : {}),
        item: { get: { 'x-codeSamples': [{ source: { $ref: '../code/sample.py' } }] } },
      }),
      [withIdentity ? 'https://example.test/canonical/code/sample.py' : 'https://example.test/code/sample.py']: source,
    }
    const fetched: string[] = []
    const store = createWorkspaceStore({
      fetch: (url) => {
        fetched.push(String(url))
        return Promise.resolve(
          new Response(resources[String(url)] ?? '', { status: String(url) in resources ? 200 : 404 }),
        )
      },
    })
    await store.addDocument({
      name: 'sample',
      documentSource: 'https://example.test/api/openapi.json',
      document: {
        ...makeDocument('3.1.0', {}),
        paths: { '/sample': { $ref: '../paths/first.json#/item' } },
      },
    })
    expect(getSamples(store.workspace.documents.sample as OpenApiDocument)?.[0]?.source).toBe(source)
    expect(fetched).toStrictEqual(Object.keys(resources))
  })

  it('honors a 3.2 document identity for relative source files', async () => {
    const fetchDocument = vi.fn((_url: string | URL | Request) => Promise.resolve(new Response('print("self")\n')))
    const store = createWorkspaceStore({ fetch: fetchDocument })
    await store.addDocument({
      name: 'sample',
      documentSource: 'https://example.test/download/openapi.json',
      document: {
        ...makeDocument('3.2.0', { 'x-codeSamples': [{ source: { $ref: './sample.py' } }] }),
        $self: 'https://example.test/canonical/openapi.json',
      },
    })
    expect(fetchDocument.mock.calls.map(([url]) => String(url))).toStrictEqual([
      'https://example.test/canonical/sample.py',
    ])
    expect(getSamples(store.workspace.documents.sample as OpenApiDocument)?.[0]?.source).toBe('print("self")\n')
  })

  it.each(['3.1.0', '3.2.0'])('loads file sources during server preprocessing in %s', async (openapi) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-code-samples-'))
    try {
      const source = 'def sample():\n    print("raw: [")\n'
      await fs.writeFile(path.join(directory, 'sample.py'), source)
      await fs.writeFile(
        path.join(directory, 'openapi.json'),
        JSON.stringify(
          makeDocument(openapi, {
            'x-codeSamples': [{ source: { $ref: './sample.py' } }],
          }),
        ),
      )
      const server = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.test',
        documents: [{ name: 'sample', path: path.join(directory, 'openapi.json') }],
        documentLoading: { basePath: directory },
      })
      expect(getSamples(server.getResolvedDocument('sample') as OpenApiDocument)?.[0]?.source).toBe(source)
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it('resolves sources in server chunks using the original document URL', async () => {
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.test',
      documents: [
        {
          name: 'sample',
          document: {
            ...makeDocument('3.1.0', { 'x-codeSamples': [{ source: { $ref: './sample.py' } }] }),
            'x-scalar-original-source-url': 'https://example.test/api/openapi.json',
          },
        },
      ],
    })
    const source = 'print("lazy")\n'
    const fetched: string[] = []
    const client = createWorkspaceStore({
      fetch: (url) => {
        const address = String(url)
        fetched.push(address)
        return Promise.resolve(new Response(address.endsWith('.py') ? source : JSON.stringify(server.get(address))))
      },
    })
    const document = getRaw(server.getWorkspace().documents.sample)
    assert(document)
    await client.addDocument({ name: 'sample', document })
    expect(fetched).toStrictEqual([])
    await client.resolve(['paths', '/sample', 'get'])
    expect(getSamples(client.workspace.documents.sample as OpenApiDocument)?.[0]?.source).toBe(source)
    expect(fetched).toStrictEqual([
      'https://example.test/sample/operations/~1sample/get',
      'https://example.test/api/sample.py',
    ])
  })

  it.each(['response', 'rejection'])('retains a failed reference after a fetch %s', async (failure) => {
    const store = createWorkspaceStore({
      fetch: () =>
        failure === 'response'
          ? Promise.resolve(new Response('missing', { status: 404 }))
          : Promise.reject(new Error('offline')),
    })
    await store.addDocument({
      name: 'sample',
      documentSource: 'https://example.test/api/openapi.json',
      document: makeDocument('3.1.0', { 'x-codeSamples': [{ source: { $ref: './sample.py' } }] }),
    })
    expect(getRaw(getSamples(store.workspace.documents.sample as OpenApiDocument)?.[0]?.source)).toStrictEqual({
      $ref: 'https://example.test/api/sample.py',
    })
  })

  it('does not fetch fragments or invent an origin for relative source files', async () => {
    const fetchDocument = vi.fn(() => Promise.resolve(new Response('unexpected')))
    const store = createWorkspaceStore({ fetch: fetchDocument })
    const samples = [{ source: { $ref: './sample.py' } }, { source: { $ref: '#/x-source' } }]
    await store.addDocument({ name: 'sample', document: makeDocument('3.1.0', { 'x-codeSamples': samples }) })
    expect(getRaw(getSamples(store.workspace.documents.sample as OpenApiDocument))).toStrictEqual(samples)
    expect(fetchDocument).toHaveBeenCalledTimes(0)
  })
})
