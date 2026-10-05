import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import { stringify } from 'yaml'

import { fetchUrls } from '@/plugins/fetch-urls/fetch-urls'
import { readFiles } from '@/plugins/read-files/read-files'
import { dereference } from '@/utils/dereference'
import { openapi } from '@/utils/openapi/openapi'

import { load } from './load'

const makeDocument = (self: unknown, reference = './pet.json#/Pet', version = '3.2.1') => ({
  openapi: version,
  $self: self,
  info: { title: 'Pets', version: '1' },
  paths: {},
  components: { schemas: { Pet: { $ref: reference } } },
})

const makeHttpLoader = (documents: Record<string, unknown>) => {
  const fetch = vi.fn((url: string) => {
    if (!(url in documents)) {
      throw new Error(`Unexpected request: ${url}`)
    }
    return Promise.resolve(new Response(JSON.stringify(documents[url])))
  })
  return { fetch, plugin: fetchUrls({ fetch }) }
}

const pet = { Pet: { type: 'string' } }
const retrieval = 'https://mirror.example/input.json'
const canonical = 'https://canonical.example/v2/openapi.json'
const petUri = 'https://canonical.example/v2/pet.json'

describe('load-self', () => {
  it.each(['http', 'files-first', 'http-first'])('loads canonical references with %s plugins', async (order) => {
    const document = makeDocument(canonical)
    const http = makeHttpLoader({ [retrieval]: document, [petUri]: pet })
    const pluginSets = {
      http: [http.plugin],
      'files-first': [readFiles(), http.plugin],
      'http-first': [http.plugin, readFiles()],
    }
    const plugins = pluginSets[order]

    const result = await load(retrieval, { plugins })

    expect(http.fetch.mock.calls).toStrictEqual([[retrieval], [petUri]])
    expect(result.errors).toStrictEqual([])
    expect(result.filesystem.map((entry) => entry.filename)).toStrictEqual([null, './pet.json'])
    expect(result.specification).toStrictEqual(document)
    expect(dereference(result.filesystem).schema.components).toStrictEqual({ schemas: { Pet: { type: 'string' } } })
  })

  it.each([
    ['./canonical/openapi.json', './pet.json', 'https://mirror.example/canonical/pet.json'],
    ['/v2/openapi.json', './pet.json', 'https://mirror.example/v2/pet.json'],
    ['../v2/', 'pet.json?version=2#/Pet', 'https://mirror.example/v2/pet.json?version=2'],
    ['', './pet.json', 'https://mirror.example/pet.json'],
    [`${canonical}#identity`, './pet.json', petUri],
    [canonical, 'https://other.example/pet.json', 'https://other.example/pet.json'],
  ])('resolves $self %s and reference %s', async (self, reference, target) => {
    const http = makeHttpLoader({ [retrieval]: makeDocument(self, reference), [target]: pet })

    const result = await load(retrieval, { plugins: [http.plugin] })

    expect(result.errors).toStrictEqual([])
    expect(http.fetch.mock.calls).toStrictEqual([[retrieval], [target]])
  })

  it.each(['object', 'json', 'yaml'])('uses an absolute identity for in-memory %s input', async (format) => {
    const document = makeDocument(canonical)
    const inputs = { object: document, json: JSON.stringify(document), yaml: stringify(document) }
    const input = inputs[format]
    const http = makeHttpLoader({ [petUri]: pet })

    const result = await load(input, { plugins: [http.plugin] })

    expect(result.errors).toStrictEqual([])
    expect(http.fetch.mock.calls).toStrictEqual([[petUri]])
    expect(document.components.schemas.Pet.$ref).toBe('./pet.json#/Pet')
  })

  it('uses the supplied filename as retrieval context for in-memory input', async () => {
    const target = 'https://mirror.example/canonical/pet.json'
    const http = makeHttpLoader({ [target]: pet })

    const result = await load(makeDocument('./canonical/openapi.json'), {
      filename: retrieval,
      plugins: [http.plugin],
    })

    expect(result.errors).toStrictEqual([])
    expect(http.fetch.mock.calls).toStrictEqual([[target]])
    expect(result.filesystem[0].filename).toBe(retrieval)
  })

  it('uses each external OpenAPI document identity through the fluent loader', async () => {
    const root = makeDocument(canonical, './shared.json#/components/schemas/Pet')
    const sharedUri = 'https://canonical.example/v2/shared.json'
    const shared = makeDocument('../models/openapi.json', './model.json#/Pet')
    const modelUri = 'https://canonical.example/models/model.json'
    const http = makeHttpLoader({ [retrieval]: root, [sharedUri]: shared, [modelUri]: pet })

    const result = await openapi()
      .load(retrieval, { plugins: [http.plugin] })
      .get()

    expect(result.errors).toStrictEqual([])
    expect(http.fetch.mock.calls).toStrictEqual([[retrieval], [sharedUri], [modelUri]])
    expect(dereference(result.filesystem).schema.components).toStrictEqual({ schemas: { Pet: { type: 'string' } } })
  })

  it.each(['local', 'http'])('loads %s references from a file-retrieved document', async (source) => {
    const directory = mkdtempSync(join(tmpdir(), 'scalar-load-self-'))
    const inputPath = join(directory, 'input.json')
    const modelDirectory = join(directory, 'canonical')
    const modelPath = join(modelDirectory, 'pet.json')
    const document = makeDocument(source === 'http' ? canonical : './canonical/openapi.json')
    const http = makeHttpLoader({ [petUri]: pet })
    try {
      writeFileSync(inputPath, JSON.stringify(document))
      mkdirSync(modelDirectory)
      writeFileSync(modelPath, JSON.stringify(pet))

      const result = await load(inputPath, { plugins: [readFiles(), http.plugin] })

      expect(result.errors).toStrictEqual([])
      expect(http.fetch.mock.calls).toStrictEqual(source === 'http' ? [[petUri]] : [])
      expect(dereference(result.filesystem).schema.components).toMatchObject({ schemas: { Pet: { type: 'string' } } })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('keeps fragment-only references local', async () => {
    const document = makeDocument(canonical, '#/components/schemas/Local')
    const input = {
      ...document,
      components: { schemas: { ...document.components.schemas, Local: { type: 'string' } } },
    }
    const http = makeHttpLoader({})

    const result = await load(input, { plugins: [http.plugin] })

    expect(http.fetch).not.toHaveBeenCalled()
    expect(result.errors).toStrictEqual([])
    expect(dereference(result.filesystem).schema.components).toMatchObject({ schemas: { Pet: { type: 'string' } } })
  })

  it.each(['2.0', '3.0.4', '3.1.2'])('ignores $self in OpenAPI %s', async (version) => {
    const http = makeHttpLoader({ [retrieval]: makeDocument(canonical, './pet.json', version) })

    const result = await load(retrieval, { plugins: [http.plugin] })

    expect(http.fetch.mock.calls).toStrictEqual([[retrieval]])
    expect(result.errors).toStrictEqual([])
    expect(result.filesystem).toHaveLength(1)
  })

  it.each([undefined, 42])('preserves behavior with $self %s', async (self) => {
    const http = makeHttpLoader({ [retrieval]: makeDocument(self) })

    const result = await load(retrieval, { plugins: [http.plugin] })

    expect(http.fetch.mock.calls).toStrictEqual([[retrieval]])
    expect(result.errors).toStrictEqual([])
    expect(result.filesystem).toHaveLength(1)
  })

  it('ignores identities inside example payloads', async () => {
    const target = 'https://mirror.example/pet.json'
    const document = makeDocument(undefined, './pet.json')
    const input = {
      ...document,
      components: { ...document.components, examples: { Example: { value: makeDocument(canonical, '#/local') } } },
    }
    const http = makeHttpLoader({ [retrieval]: input, [target]: pet })

    const result = await load(retrieval, { plugins: [http.plugin] })

    expect(http.fetch.mock.calls).toStrictEqual([[retrieval]])
    expect(result.errors).toStrictEqual([])
  })

  it('does not enable network loading with only a file loader', async () => {
    const input = makeDocument(canonical)
    const get = vi.fn()
    const plugin = { ...readFiles(), get }

    const result = await load(input, { plugins: [plugin] })

    expect(get).not.toHaveBeenCalled()
    expect(result.errors).toStrictEqual([])
    expect(result.filesystem).toHaveLength(1)
  })

  it.each(['./canonical/openapi.json', 'https://[invalid', 'urn:example:api'])(
    'reports invalid resolution from %s',
    async (self) => {
      const http = makeHttpLoader({})
      const input = makeDocument(self)

      const result = await load(input, { plugins: [http.plugin] })

      expect(result.errors).toEqual([{ code: 'INVALID_REFERENCE', message: expect.any(String) }])
      expect(http.fetch).not.toHaveBeenCalled()
      await expect(load(input, { plugins: [http.plugin], throwOnError: true })).rejects.toThrow(
        "Can't resolve reference:",
      )
    },
  )

  it('reports missing canonical targets and preserves throwOnError', async () => {
    const get = vi.fn((target: string) => {
      throw new Error(`Missing: ${target}`)
    })
    const plugin = { check: (value: unknown) => typeof value === 'string' && value.startsWith('https://'), get }

    const result = await load(makeDocument(canonical), { plugins: [plugin] })

    expect(get).toHaveBeenCalledWith(petUri)
    expect(result.errors).toStrictEqual([
      { code: 'EXTERNAL_REFERENCE_NOT_FOUND', message: `Can't resolve external reference: ${petUri}` },
    ])
    await expect(load(makeDocument(canonical), { plugins: [plugin], throwOnError: true })).rejects.toThrow(petUri)
  })

  it('preserves the configured HTTP request limit', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify(pet))))
    const plugin = fetchUrls({ fetch, limit: 0 })
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      const result = await load(makeDocument(canonical), { plugins: [plugin] })
      expect(fetch).not.toHaveBeenCalled()
      expect(result.errors).toStrictEqual([{ code: 'NO_CONTENT', message: 'No content found' }])
    } finally {
      warning.mockRestore()
    }
  })
})
