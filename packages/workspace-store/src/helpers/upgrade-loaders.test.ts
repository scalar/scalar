import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import { type LoaderPlugin, bundle } from '@scalar/json-magic/bundle'
import { upgrade } from '@scalar/openapi-upgrader'
import { describe, expect, it } from 'vitest'

import { upgradeLoadedDocument, upgradeLoaders } from './upgrade-loaders'

describe('upgrade-loaders', () => {
  it('upgrades a complete OpenAPI 3.0 document', () => {
    const input = {
      openapi: '3.0.3',
      info: { title: 't', version: '1' },
      components: { schemas: { Item: { type: 'string', nullable: true } } },
    }

    const result = upgradeLoadedDocument(input, '3.1.0')

    expect(result).toMatchObject({
      openapi: '3.1.1',
      components: { schemas: { Item: { type: ['string', 'null'] } } },
    })
    // The loaded object is not modified
    expect(input.openapi).toBe('3.0.3')
  })

  it('leaves OpenAPI 3.1 and 3.2 documents alone', () => {
    const input = { openapi: '3.1.0', components: { schemas: { Item: { type: 'string', nullable: true } } } }

    expect(upgradeLoadedDocument(input, '3.0.3')).toBe(input)
  })

  it('leaves Swagger 2.0 documents alone', () => {
    const input = { swagger: '2.0', definitions: { Item: { type: 'string' } } }

    expect(upgradeLoadedDocument(input, '3.0.3')).toBe(input)
  })

  it('upgrades a bare schema fragment of an OpenAPI 3.0 entry document', () => {
    const result = upgradeLoadedDocument(
      { type: 'object', properties: { name: { type: 'string', nullable: true, example: 'Ada' } }, example: { a: 1 } },
      '3.0.3',
      ['components', 'schemas', 'Item'],
    )

    expect(result).toEqual({
      type: 'object',
      properties: { name: { type: ['string', 'null'], examples: ['Ada'] } },
      examples: [{ a: 1 }],
    })
  })

  it('upgrades a headerless document body of an OpenAPI 3.0 entry document', () => {
    const result = upgradeLoadedDocument(
      { components: { schemas: { Item: { type: 'string', nullable: true } } } },
      '3.0.3',
    )

    expect(result).toEqual({ components: { schemas: { Item: { type: ['string', 'null'] } } } })
  })

  it('does not touch fragments of entry documents that are not OpenAPI 3.0', () => {
    const input = { type: 'string', nullable: true }

    expect(upgradeLoadedDocument(input, '3.1.0')).toBe(input)
    expect(upgradeLoadedDocument(input, undefined)).toBe(input)
  })

  it('ignores values that are not objects', () => {
    expect(upgradeLoadedDocument('text', '3.0.3')).toBe('text')
    expect(upgradeLoadedDocument(['a'], '3.0.3')).toEqual(['a'])
    expect(upgradeLoadedDocument(null, '3.0.3')).toBe(null)
  })
  it('upgrades what the loader returns and passes failures through', async () => {
    const plugins = upgradeLoaders(
      [
        {
          type: 'loader',
          validate: () => true,
          exec: async (value) =>
            value === 'missing'
              ? { ok: false }
              : {
                  ok: true,
                  raw: '',
                  data: { openapi: '3.0.0', components: { schemas: { A: { type: 'string', nullable: true } } } },
                },
        },
      ],
      '3.0.0',
    )

    const loader = plugins.find((plugin) => plugin.type === 'loader')

    expect(loader?.validate('x')).toBe(true)
    expect(await loader?.exec('missing')).toEqual({ ok: false })
    expect(await loader?.exec('x')).toMatchObject({
      ok: true,
      data: { components: { schemas: { A: { type: ['string', 'null'] } } } },
    })
  })
  it.each([
    {
      kind: 'schema',
      path: ['components', 'schemas', 'Item'],
      value: { type: 'string', nullable: true, example: 'hello' },
    },
    {
      kind: 'parameter',
      path: ['components', 'parameters', 'limit'],
      value: { name: 'limit', in: 'query', schema: { type: 'integer' }, example: 10 },
    },
    { kind: 'header with only an example', path: ['components', 'headers', 'Limit'], value: { example: 10 } },
    {
      kind: 'response',
      path: ['paths', '/items', 'get', 'responses', '200'],
      value: {
        description: 'ok',
        content: { 'application/json': { schema: { type: 'string', nullable: true }, example: 'hello' } },
      },
    },
    {
      kind: 'path item',
      path: ['paths', '/items'],
      value: {
        get: {
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' }, example: 10 }],
          responses: { '200': { description: 'ok' } },
        },
      },
    },
    {
      kind: 'example',
      path: ['components', 'examples', 'Item'],
      value: { value: { type: 'string', nullable: true, example: 'payload', exclusiveMinimum: true, minimum: 1 } },
    },
  ])('matches inline conversion for a bare $kind', async ({ path, value }) => {
    const original = JSON.stringify(value)
    const inline: Record<string, unknown> = { openapi: '3.0.3' }
    setValueAtPath(inline, path, value)
    const document: Record<string, unknown> = { openapi: '3.1.1' }
    setValueAtPath(document, path, { $ref: 'https://example.test/fragment.json' })
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => Promise.resolve({ ok: true, raw: original, data: value }),
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const reference = getValueAtPath<{ $ref: string }>(document, path)
    expect(getValueAtPath(document, parseJsonPointerSegments(reference.$ref.slice(1)))).toStrictEqual(
      getValueAtPath(upgrade(inline, '3.1'), path),
    )
    expect(JSON.stringify(value)).toBe(original)
  })

  it('upgrades separate pointers in a shared file without renaming keys or loading it twice', async () => {
    const data = { example: { type: 'string', nullable: true }, limit: { name: 'limit', in: 'query', example: 10 } }
    const original = JSON.stringify(data)
    const loads: string[] = []
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (url) => {
        loads.push(url)
        return Promise.resolve({ ok: true, raw: original, data })
      },
    }
    const document = {
      openapi: '3.1.1',
      components: {
        schemas: { Item: { $ref: 'https://example.test/shared.json#/example' } },
        parameters: { limit: { $ref: 'https://example.test/shared.json#/limit' } },
      },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const resolve = (ref: string): unknown => getValueAtPath(document, parseJsonPointerSegments(ref.slice(1)))
    expect(resolve(document.components.schemas.Item.$ref)).toStrictEqual({ type: ['string', 'null'] })
    expect(resolve(document.components.parameters.limit.$ref)).toStrictEqual({
      name: 'limit',
      in: 'query',
      examples: { default: { value: 10 } },
    })
    expect(loads).toStrictEqual(['https://example.test/shared.json'])
    expect(JSON.stringify(data)).toBe(original)
  })

  it('preserves example payloads reached through a second external reference', async () => {
    const example = { value: { type: 'string', nullable: true, example: 'payload' } }
    const files: Record<string, unknown> = {
      'https://example.test/response.json': {
        description: 'ok',
        content: { 'application/json': { examples: { item: { $ref: './example.json' } } } },
      },
      'https://example.test/example.json': example,
    }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (url) => Promise.resolve({ ok: true, raw: JSON.stringify(files[url]), data: files[url] }),
    }
    const document = {
      openapi: '3.1.1',
      components: { responses: { Item: { $ref: 'https://example.test/response.json' } } },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const response = getValueAtPath<Record<string, unknown>>(
      document,
      parseJsonPointerSegments(document.components.responses.Item.$ref.slice(1)),
    )
    const reference = getValueAtPath<{ $ref: string }>(response, ['content', 'application/json', 'examples', 'item'])
    expect(getValueAtPath(document, parseJsonPointerSegments(reference.$ref.slice(1)))).toStrictEqual(example)
  })

  it('upgrades local references within a bare external file', async () => {
    const data = { Item: { $ref: '#/Name' }, Name: { type: 'string', nullable: true } }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => Promise.resolve({ ok: true, raw: '', data }),
    }
    const document = {
      openapi: '3.1.1',
      components: { schemas: { Item: { $ref: 'https://example.test/schemas.json#/Item' } } },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const reference = getValueAtPath<{ $ref: string }>(
      document,
      parseJsonPointerSegments(document.components.schemas.Item.$ref.slice(1)),
    )
    expect(getValueAtPath(document, parseJsonPointerSegments(reference.$ref.slice(1)))).toStrictEqual({
      type: ['string', 'null'],
    })
  })

  it('retains the selected subtree context during lazy resolution', async () => {
    const value = { example: 10 }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => Promise.resolve({ ok: true, raw: '', data: value }),
    }
    const document = {
      openapi: '3.1.1',
      components: { headers: { Limit: { $ref: 'https://example.test/header.json' } } },
    }
    const target = document.components.headers.Limit

    await bundle(target, {
      root: document,
      treeShake: false,
      plugins: upgradeLoaders([loader], '3.0.3', ['components', 'headers', 'Limit']),
    })

    expect(getValueAtPath(document, parseJsonPointerSegments(target.$ref.slice(1)))).toStrictEqual({
      examples: { default: { value: 10 } },
    })
  })

  it.each([
    { order: ['A', 'B'], nested: false },
    { order: ['B', 'A'], nested: false },
    { order: ['A', 'B'], nested: true },
    { order: ['B', 'A'], nested: true },
  ])('propagates context through cached references in order $order (nested: $nested)', async ({ order, nested }) => {
    const files: Record<string, unknown> = {
      'https://example.test/shared.json': {
        A: { type: 'string', nullable: true },
        B: nested ? { type: 'object', properties: { value: { $ref: './C.json' } } } : { $ref: './C.json' },
      },
      'https://example.test/C.json': { type: 'integer', nullable: true },
    }
    const loads: string[] = []
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (url) => {
        loads.push(url)
        return Promise.resolve({ ok: true, raw: JSON.stringify(files[url]), data: files[url] })
      },
    }
    const document = {
      openapi: '3.1.1',
      components: {
        schemas: Object.fromEntries(order.map((name) => [name, { $ref: `https://example.test/shared.json#/${name}` }])),
      },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const b = getValueAtPath<Record<string, unknown>>(
      document,
      parseJsonPointerSegments(document.components.schemas.B!.$ref.slice(1)),
    )
    const reference = nested ? getValueAtPath<{ $ref: string }>(b, ['properties', 'value']).$ref : (b.$ref as string)
    expect(getValueAtPath(document, parseJsonPointerSegments(reference.slice(1)))).toStrictEqual({
      type: ['integer', 'null'],
    })
    expect(loads.sort()).toStrictEqual(['https://example.test/C.json', 'https://example.test/shared.json'])
  })

  it.each([false, true])('propagates context through an already processed local alias (cyclic: %s)', async (cyclic) => {
    const files: Record<string, unknown> = {
      'https://example.test/shared.json': { Alias: { $ref: './C.json' }, Item: { $ref: '#/Alias' } },
      'https://example.test/C.json': cyclic
        ? { type: 'object', nullable: true, properties: { next: { $ref: './shared.json#/Item' } } }
        : { type: 'integer', nullable: true },
    }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (url) => Promise.resolve({ ok: true, raw: JSON.stringify(files[url]), data: files[url] }),
    }
    const document = {
      openapi: '3.1.1',
      components: { schemas: { Item: { $ref: 'https://example.test/shared.json#/Item' } } },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const item = getValueAtPath<{ $ref: string }>(
      document,
      parseJsonPointerSegments(document.components.schemas.Item.$ref.slice(1)),
    )
    const alias = getValueAtPath<{ $ref: string }>(document, parseJsonPointerSegments(item.$ref.slice(1)))
    const target = getValueAtPath<Record<string, unknown>>(document, parseJsonPointerSegments(alias.$ref.slice(1)))
    expect(target.type).toStrictEqual([cyclic ? 'object' : 'integer', 'null'])
    expect(target.nullable).toBeUndefined()
    if (cyclic) {
      const next = getValueAtPath<{ $ref: string }>(target, ['properties', 'next'])
      expect(getValueAtPath(document, parseJsonPointerSegments(next.$ref.slice(1)))).toBe(item)
    }
  })

  it.each([
    { fragment: '%2FItem', key: 'Item' },
    { fragment: '/50%', key: '50%' },
    { fragment: '/%252F', key: '%2F' },
  ])('upgrades URI fragment $fragment using the same decoding as the bundler', async ({ fragment, key }) => {
    const data = { [key]: { type: 'string', nullable: true } }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => Promise.resolve({ ok: true, raw: JSON.stringify(data), data }),
    }
    const document = {
      openapi: '3.1.1',
      components: { schemas: { Item: { $ref: `https://example.test/schemas.json#${fragment}` } } },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const externals = getValueAtPath<Record<string, Record<string, unknown>>>(document, ['x-ext'])
    expect(Object.values(externals).map((external) => external[key])).toStrictEqual([{ type: ['string', 'null'] }])
  })
})
