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

  it.each([
    ['Child', 'Parent'],
    ['Parent', 'Child'],
  ])('preserves pointers to a relocated bare schema when resolving %s before %s', async (first, second) => {
    const url = 'https://example.test/shared.json'
    const data = { Parent: { nullable: true, allOf: [{ type: 'string' }] } }
    const refs = { Child: `${url}#/Parent/allOf/0`, Parent: `${url}#/Parent` }
    const literal = { $ref: '#/x-ext/shared/Parent/allOf/0' }
    const document = {
      openapi: '3.1.1',
      components: {
        schemas: {
          [first]: { $ref: refs[first as keyof typeof refs] },
          Literal: { examples: [{ ...literal }] },
          [second]: { $ref: refs[second as keyof typeof refs] },
        },
      },
    }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => Promise.resolve({ ok: true, raw: JSON.stringify(data), data }),
    }

    await bundle(document, {
      treeShake: false,
      compress: () => 'shared',
      plugins: upgradeLoaders([loader], '3.0.3'),
    })

    const resolve = (name: string): unknown =>
      getValueAtPath(
        document,
        parseJsonPointerSegments(
          getValueAtPath<{ $ref: string }>(document, ['components', 'schemas', name]).$ref.slice(1),
        ),
      )
    expect(document.components.schemas.Literal.examples).toStrictEqual([literal])
    expect(resolve('Child')).toStrictEqual({ type: 'string' })
    expect(getValueAtPath(resolve('Parent'), ['anyOf', '0'])).toBe(resolve('Child'))
  })

  it('resolves external and local pointers to schemas moved during a complete document upgrade', async () => {
    const url = 'https://example.test/external.json'
    const pointer = '#/components/schemas/Parent/allOf/0/allOf/1'
    const data = {
      openapi: '3.0.3',
      info: { title: 'External', version: '1' },
      paths: {},
      components: {
        schemas: {
          Parent: {
            nullable: true,
            allOf: [{ nullable: true, allOf: [{ type: 'object' }, { type: 'string', nullable: true }] }],
          },
          Alias: { $ref: pointer },
        },
      },
    }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: (uri) => uri === url,
      exec: () => Promise.resolve({ ok: true, raw: JSON.stringify(data), data }),
    }
    const document = {
      openapi: '3.1.1',
      components: {
        schemas: { Direct: { $ref: url + pointer }, Indirect: { $ref: url + '#/components/schemas/Alias' } },
      },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.1.1') })

    const resolve = (reference: string): unknown =>
      getValueAtPath(document, parseJsonPointerSegments(reference.slice(1)))
    const direct = resolve(document.components.schemas.Direct.$ref)
    const alias = resolve(document.components.schemas.Indirect.$ref) as { $ref: string }
    expect(direct).toStrictEqual({ type: ['string', 'null'] })
    expect(resolve(alias.$ref)).toBe(direct)

    const standalone = (await bundle(url, {
      treeShake: false,
      plugins: upgradeLoaders([loader], '3.0.3'),
    })) as typeof data
    const standalonePointer = standalone.components.schemas.Alias.$ref
    expect(getValueAtPath(standalone, parseJsonPointerSegments(standalonePointer.slice(1)))).toStrictEqual(direct)
  })

  it.each([
    [false, 'Parent'],
    [true, 'Parent'],
    [false, '0'],
    [true, '0'],
  ] as const)('retains pointers to moved headerless children (child first: %s, key: %s)', async (childFirst, key) => {
    const url = 'https://example.test/shared.json'
    const parent = { nullable: true, allOf: [{ type: 'string', nullable: true }] }
    const data = key === '0' ? [parent] : { Parent: parent }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: (uri) => uri === url,
      exec: () => Promise.resolve({ ok: true, raw: JSON.stringify(data), data }),
    }
    const Parent = { $ref: url + `#/${key}` }
    const Child = { $ref: url + `#/${key}/allOf/0` }
    const document = { openapi: '3.1.1', components: { schemas: childFirst ? { Child, Parent } : { Parent, Child } } }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const resolve = (reference: string): unknown =>
      getValueAtPath(document, parseJsonPointerSegments(reference.slice(1)))
    expect(resolve(Parent.$ref)).toStrictEqual({ anyOf: [{ type: ['string', 'null'] }, { type: 'null' }] })
    expect(resolve(Child.$ref)).toBe(getValueAtPath(resolve(Parent.$ref), ['anyOf', '0']))
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

  it('waits for reference context before upgrading a headerless file', () => {
    const input = { components: { schemas: { Item: { type: 'string', nullable: true } } } }

    expect(upgradeLoadedDocument(input, '3.0.3')).toBe(input)
  })

  it('upgrades a schema referenced within a headerless document body', async () => {
    const data = { components: { schemas: { Item: { type: 'string', nullable: true, example: 'hello' } } } }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: () => Promise.resolve({ ok: true, raw: JSON.stringify(data), data }),
    }
    const document = {
      openapi: '3.1.1',
      components: { schemas: { Item: { $ref: 'https://example.test/shared.json#/components/schemas/Item' } } },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    expect(
      getValueAtPath(document, parseJsonPointerSegments(document.components.schemas.Item.$ref.slice(1))),
    ).toStrictEqual({ type: ['string', 'null'], examples: ['hello'] })
    expect(data.components.schemas.Item).toStrictEqual({ type: 'string', nullable: true, example: 'hello' })
  })

  it.each(['openapi', 'swagger', 'asyncapi', 'paths', 'components', 'webhooks'])(
    'retains reference context for a shared schema map containing "%s"',
    async (name) => {
      const schema = { type: 'string', nullable: true, example: 'hello' }
      const data = { [name]: schema, Item: schema }
      const loads: string[] = []
      const loader: LoaderPlugin = {
        type: 'loader',
        validate: () => true,
        exec: (url) => {
          loads.push(url)
          return Promise.resolve({ ok: true, raw: JSON.stringify(data), data })
        },
      }
      const document = {
        openapi: '3.1.1',
        components: {
          schemas: {
            Named: { $ref: `https://example.test/shared.json#/${name}` },
            Item: { $ref: 'https://example.test/shared.json#/Item' },
          },
        },
      }

      await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

      for (const reference of Object.values(document.components.schemas)) {
        expect(getValueAtPath(document, parseJsonPointerSegments(reference.$ref.slice(1)))).toStrictEqual({
          type: ['string', 'null'],
          examples: ['hello'],
        })
      }
      expect(loads).toStrictEqual(['https://example.test/shared.json'])
      expect(schema).toStrictEqual({ type: 'string', nullable: true, example: 'hello' })
    },
  )

  it.each(['https://example.test/openapi.json', './openapi.json'])(
    'resolves references to the loaded entry URI "%s" without fetching it again',
    async (uri) => {
      const loads: string[] = []
      const loader: LoaderPlugin = {
        type: 'loader',
        validate: () => true,
        exec: (url) => {
          loads.push(url)
          return Promise.reject(new Error('The entry document is already loaded'))
        },
      }
      const document = {
        openapi: '3.1.1',
        components: {
          schemas: { Item: { type: 'string' }, Alias: { $ref: `${uri}#/components/schemas/Item` } },
        },
      }

      await bundle(document, {
        origin: 'https://example.test/openapi.json',
        treeShake: false,
        plugins: upgradeLoaders([loader], '3.0.3'),
      })

      expect(document.components.schemas.Alias).toStrictEqual({ $ref: '#/components/schemas/Item' })
      expect(loads).toStrictEqual([])
    },
  )

  it.each(['', 'constructor', 'prototype', '__proto__'])('upgrades a fragment at property name "%s"', (name) => {
    expect(
      upgradeLoadedDocument({ type: 'string', nullable: true }, '3.0.3', [
        'components',
        'schemas',
        'Item',
        'properties',
        name,
      ]),
    ).toStrictEqual({ type: ['string', 'null'] })
  })

  it.each([
    { order: ['Child', 'Parent'], childPath: ['properties', 'Child'] },
    { order: ['Parent', 'Child'], childPath: ['properties', 'Child'] },
    { order: ['Child', 'Parent'], childPath: ['allOf', '0'] },
    { order: ['Parent', 'Child'], childPath: ['allOf', '0'] },
  ])('preserves overlapping fragments in order $order at $childPath', async ({ order, childPath }) => {
    const literal = { type: 'string', nullable: true, example: 'payload' }
    const child = { type: 'object', example: literal }
    const parent = {
      type: 'object',
      nullable: true,
      ...(childPath[0] === 'allOf' ? { allOf: [child] } : { properties: { Child: child } }),
    }
    const data = { Parent: parent }
    const loads: string[] = []
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (url) => {
        loads.push(url)
        return Promise.resolve({ ok: true, raw: JSON.stringify(data), data })
      },
    }
    const document = {
      openapi: '3.1.1',
      components: {
        schemas: Object.fromEntries(
          order.map((name) => [
            name,
            { $ref: `https://example.test/shared.json#/Parent${name === 'Child' ? `/${childPath.join('/')}` : ''}` },
          ]),
        ),
      },
    }

    await bundle(document, { treeShake: false, plugins: upgradeLoaders([loader], '3.0.3') })

    const resolve = (name: string): unknown =>
      getValueAtPath(document, parseJsonPointerSegments(document.components.schemas[name]!.$ref.slice(1)))
    const resolvedParent = resolve('Parent')
    expect(resolve('Child')).toStrictEqual({ type: 'object', examples: [literal] })
    expect(getValueAtPath(resolvedParent, childPath)).toBe(resolve('Child'))
    expect(resolvedParent).toStrictEqual({
      type: ['object', 'null'],
      ...(childPath[0] === 'allOf'
        ? { allOf: [{ type: 'object', examples: [literal] }] }
        : { properties: { Child: { type: 'object', examples: [literal] } } }),
    })
    expect(loads).toStrictEqual(['https://example.test/shared.json'])
    expect(data.Parent).toStrictEqual(parent)
    expect(child).toStrictEqual({ type: 'object', example: literal })
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
