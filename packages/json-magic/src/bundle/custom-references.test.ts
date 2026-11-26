import { describe, expect, it } from 'vitest'

import { getSegmentsFromPath } from '@/helpers/get-segments-from-path'
import { getValueByPath } from '@/helpers/get-value-by-path'

import { checkDocument } from '../document'
import { type Config, type LoaderPlugin, bundle } from './bundle'
import { bundleWithDiagnostics } from './bundle-with-diagnostics'

const literal = { $id: './literal.json', $anchor: 'same', $ref: './literal.json' }
const api = {
  openapi: '3.1.0',
  info: { title: 'Custom references', version: '1.0.0' },
  paths: {},
}

const fixtureDocument = {
  ...api,
  'x-entry': {
    $ref: './custom.json',
    sibling: { $ref: './sibling.json' },
    value: literal,
  },
  components: {
    schemas: {
      A: {
        $id: './schemas/A.json',
        $anchor: 'same',
        custom: { $ref: './local.json' },
        'x-resource': {
          $id: '../X.json',
          $anchor: 'same',
          $ref: './payload.json',
          sibling: { $ref: './sibling.json' },
          native: { $ref: './root.json#/components/schemas/Shared' },
          default: literal,
        },
        default: literal,
        examples: [literal],
        enum: [literal],
        const: literal,
      },
      Shared: { type: 'boolean', examples: [literal] },
    },
  },
}

const fixture = (): typeof fixtureDocument => structuredClone(fixtureDocument)

const documents = {
  'https://source.test/custom.json': { type: 'string' },
  'https://source.test/sibling.json': { type: 'integer' },
  'https://source.test/schemas/local.json': {
    $anchor: 'same',
    type: 'object',
    properties: { shared: { $ref: '../root.json#/components/schemas/Shared' } },
  },
  'https://source.test/payload.json': {
    $anchor: 'same',
    type: 'object',
    properties: {
      back: { $ref: './schemas/A.json#same' },
      remote: { $ref: 'HTTPS://unreachable.test/schema#same' },
    },
  },
}

const loader = (reads: string[]): LoaderPlugin => ({
  type: 'loader',
  validate: () => true,
  exec: (uri) => {
    reads.push(uri)
    const data = documents[uri]
    return Promise.resolve(data ? { ok: true, data: structuredClone(data), raw: '' } : { ok: false })
  },
})

const local = (resource: object, reference: string): unknown =>
  getValueByPath(
    resource,
    getSegmentsFromPath(decodeURIComponent(new URL(reference, 'https://output.test/root.json').hash)),
  ).value

describe('custom-references', () => {
  it.each(['callbacks', 'pathItems', 'webhooks'])(
    'visits Path Item reference siblings under x-prefixed names in %s',
    async (placement) => {
      const pathItem = {
        $ref: 'https://unreachable.test/path',
        get: {
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: './custom.json' } } } },
          },
        },
      }
      const names =
        placement === 'callbacks' ? { 'x-event': { '{\$request.body#/url}': pathItem } } : { 'x-event': pathItem }
      const reads: string[] = []
      const result = await bundleWithDiagnostics(
        { ...api, ...(placement === 'webhooks' ? { webhooks: names } : { components: { [placement]: names } }) },
        {
          origin: 'https://source.test/root.json',
          traversal: 'document',
          includeCustomReferences: true,
          treeShake: true,
          plugins: [loader(reads)],
          preserveReference: (reference) => reference === 'https://unreachable.test/path',
        },
      )
      expect(result.diagnostics).toStrictEqual([])
      expect(reads).toStrictEqual(['https://source.test/custom.json'])
      expect(pathItem.$ref).toBe('https://unreachable.test/path')
      expect(local(result.document, pathItem.get.responses[200].content['application/json'].schema.$ref)).toStrictEqual(
        { type: 'string' },
      )
    },
  )

  it('preserves literal values in x-prefixed named Links and Responses', async () => {
    const link = {
      operationId: 'getValue',
      parameters: { value: { $ref: './parameter.json' } },
      requestBody: { $ref: './body.json' },
    }
    const response = { description: 'OK', links: { 'x-next': structuredClone(link) } }
    const reads: string[] = []
    const result = await bundleWithDiagnostics(
      { ...api, components: { links: { 'x-next': link }, responses: { 'x-result': response } } },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        plugins: [loader(reads)],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual([])
    expect(link).toStrictEqual({
      operationId: 'getValue',
      parameters: { value: { $ref: './parameter.json' } },
      requestBody: { $ref: './body.json' },
    })
    expect(response.links['x-next']).toStrictEqual(link)
  })

  it('resolves escaped custom keys without mapping synthetic literal copies to source URLs', async () => {
    const entry = { $ref: '#/x-target/a~1b~0c%20%25/value' }
    const target = { $ref: './custom.json' }
    const reads: string[] = []
    const result = await bundleWithDiagnostics(
      { ...api, 'x-entry': entry, 'x-target': { 'a/b~c %': { value: target } } },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: true,
        urlMap: true,
        compress: (value) => (value === 'custom.json' ? 'literal-0' : 'custom'),
        plugins: [loader(reads)],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual(['https://source.test/custom.json'])
    expect(target).toStrictEqual({ $ref: './custom.json' })
    expect(entry.$ref).toBe('#/x-ext/literal-0')
    expect(local(result.document, entry.$ref)).toStrictEqual({ $ref: '#/x-ext/custom' })
    expect(local(result.document, '#/x-ext/custom')).toStrictEqual({ type: 'string' })
    expect(result.document).toHaveProperty('x-ext-urls', { custom: 'custom.json' })
  })

  it.each(
    ['extension', 'keyword'].flatMap((placement) =>
      ['schemas', 'paths', 'responses', 'components', 'properties'].map((key) => ({ placement, key })),
    ),
  )('keeps arbitrary custom $key values reference-bearing in $placement values', async ({ placement, key }) => {
    const reads: string[] = []
    const custom = { [key]: { $ref: './custom.json' }, examples: [literal], default: literal }
    const result = await bundleWithDiagnostics(
      {
        ...api,
        ...(placement === 'extension' ? { 'x-custom': custom } : { components: { schemas: { A: { custom } } } }),
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        plugins: [loader(reads)],
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual(['https://source.test/custom.json'])
    const exported = JSON.parse(JSON.stringify(result.document))
    const bundledCustom = placement === 'extension' ? exported['x-custom'] : exported.components.schemas.A.custom
    expect(local(exported, bundledCustom[key].$ref)).toStrictEqual({ type: 'string' })
    expect(bundledCustom.examples).toStrictEqual([literal])
    expect(bundledCustom.default).toStrictEqual(literal)
  })

  it.each(['extension', 'keyword'])('uses schema map rules for declared schemas in %s values', async (placement) => {
    const reads: string[] = []
    const custom = {
      type: 'object',
      properties: { default: { $ref: './custom.json' }, examples: { $ref: './custom.json' } },
      examples: [literal],
    }
    const result = await bundleWithDiagnostics(
      {
        ...api,
        ...(placement === 'extension' ? { 'x-custom': custom } : { components: { schemas: { A: { custom } } } }),
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        plugins: [loader(reads)],
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual(['https://source.test/custom.json'])
    const exported = JSON.parse(JSON.stringify(result.document))
    const bundledCustom = placement === 'extension' ? exported['x-custom'] : exported.components.schemas.A.custom
    expect(local(exported, bundledCustom.properties.default.$ref)).toStrictEqual({ type: 'string' })
    expect(local(exported, bundledCustom.properties.examples.$ref)).toStrictEqual({ type: 'string' })
    expect(bundledCustom.examples).toStrictEqual([literal])
  })

  it.each([false, true])('retains custom context when transforming a target (external: %s)', async (external) => {
    const reads: string[] = []
    const result = await bundleWithDiagnostics(
      {
        ...api,
        'x-entry': { $ref: external ? './container.json#/value' : '#/x-data/value' },
        'x-data': { value: { marker: true } },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        hooks: {
          resolveDocument: (_document, uri) =>
            uri.endsWith('container.json') ? { baseUri: uri, visitReferencedSubtrees: true } : undefined,
          onBeforeTargetProcess: (_target, { path }) =>
            path.at(-1) === 'value'
              ? { value: { schemas: { $ref: './custom.json' }, examples: [literal] } }
              : undefined,
        },
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              reads.push(uri)
              return Promise.resolve({
                ok: true,
                raw: '',
                data: uri.endsWith('container.json') ? { value: { marker: true } } : { type: 'string' },
              })
            },
          },
        ],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual([
      ...(external ? ['https://source.test/container.json'] : []),
      'https://source.test/custom.json',
    ])
    const exported = JSON.parse(JSON.stringify(result.document))
    if (external) {
      const source = Object.values(exported['x-ext'] as Record<string, { value?: unknown }>).find(
        (value) => value.value !== undefined,
      )
      expect(source?.value).toStrictEqual({ marker: true })
    } else expect(exported['x-data'].value).toStrictEqual({ marker: true })
    const target = local(exported, exported['x-entry'].$ref)
    if (target === null || typeof target !== 'object' || !('schemas' in target)) {
      throw new Error('Missing transformed custom target')
    }
    expect(local(exported, (target.schemas as { $ref: string }).$ref)).toStrictEqual({ type: 'string' })
    expect('examples' in target ? target.examples : undefined).toStrictEqual([literal])
  })

  it('retains native target rules when a custom reference transforms it', async () => {
    const reads: string[] = []
    const parameter = {
      $ref: 'https://unreachable.test/parameter',
      ignored: { $ref: './ignored.json' },
    }
    const result = await bundleWithDiagnostics(
      {
        ...api,
        'x-entry': { $ref: '#/components/parameters/P' },
        components: { parameters: { P: parameter } },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        hooks: { onBeforeTargetProcess: (target) => ({ value: structuredClone(target) }) },
        plugins: [loader(reads)],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.components.parameters.P).toStrictEqual(parameter)
  })

  it.each(['schema', 'parameter'].flatMap((kind) => [false, true].map((customFirst) => ({ kind, customFirst }))))(
    'exposes an extension-stored $kind with native rules (custom first: $customFirst)',
    async ({ kind, customFirst }) => {
      const reads: string[] = []
      const schema = { properties: { default: { $ref: './custom.json' }, shared: { $ref: './custom.json' } } }
      const native = {
        components: { [kind === 'schema' ? 'schemas' : 'parameters']: { Entry: { $ref: '#/x-target' } } },
      }
      const extension = { 'x-target': kind === 'schema' ? schema : { name: 'p', in: 'query', schema } }
      const result = await bundleWithDiagnostics(
        { ...api, ...(customFirst ? extension : native), ...(customFirst ? native : extension) },
        {
          origin: 'https://source.test/root.json',
          traversal: 'document',
          includeCustomReferences: true,
          treeShake: false,
          preserveReference: (reference) => /^https?:\/\//i.test(reference),
          plugins: [loader(reads)],
        },
      )
      expect(result.diagnostics).toStrictEqual([])
      expect(reads).toStrictEqual(['https://source.test/custom.json'])
      const exported = JSON.parse(JSON.stringify(result.document))
      const bundledSchema = kind === 'schema' ? exported['x-target'] : exported['x-target'].schema
      expect(local(exported, bundledSchema.properties.default.$ref)).toStrictEqual({ type: 'string' })
      expect(local(exported, bundledSchema.properties.shared.$ref)).toStrictEqual({ type: 'string' })
    },
  )

  it('reports each source error once when a native reference reinterprets a custom target', async () => {
    const reads: string[] = []
    const result = await bundleWithDiagnostics(
      {
        ...api,
        'x-target': { properties: { shared: { $ref: './missing.json' }, default: { $ref: './custom.json' } } },
        components: { schemas: { Entry: { $ref: '#/x-target' } } },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        plugins: [loader(reads)],
      },
    )
    expect(reads).toStrictEqual(['https://source.test/missing.json', 'https://source.test/custom.json'])
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'unresolved-document',
        reference: './missing.json',
        source: 'https://source.test/root.json',
        pointer: '#/x-target/properties/shared/$ref',
      },
    ])
    expect(result.complete).toBe(false)
  })

  it.each(
    [
      { format: 'OpenAPI 3.0', header: { openapi: '3.0.4', paths: {} }, siblings: false },
      { format: 'OpenAPI 3.1', header: { openapi: '3.1.0', paths: {} }, siblings: true },
      { format: 'AsyncAPI 3.1', header: { asyncapi: '3.1.0', channels: {} }, siblings: false },
    ].flatMap((variant) => [false, true].map((customFirst) => ({ ...variant, customFirst }))),
  )(
    'applies $format rules to declared extension targets (custom first: $customFirst)',
    async ({ header, siblings, customFirst }) => {
      const reads: string[] = []
      const native = { components: { schemas: { Entry: { $ref: '#/x-target' } } } }
      const extension = {
        'x-target': {
          type: 'object',
          properties: {
            p: { $ref: 'https://unreachable.test/schema', 'x-extra': { $ref: './sibling.json' } },
          },
        },
      }
      const result = await bundleWithDiagnostics(
        { ...header, info: api.info, ...(customFirst ? extension : native), ...(customFirst ? native : extension) },
        {
          origin: 'https://source.test/root.json',
          traversal: 'document',
          includeCustomReferences: true,
          treeShake: false,
          preserveReference: (reference) => /^https?:\/\//i.test(reference),
          plugins: [loader(reads)],
        },
      )
      expect(result.diagnostics).toStrictEqual([])
      expect(reads).toStrictEqual(siblings ? ['https://source.test/sibling.json'] : [])
      const exported = JSON.parse(JSON.stringify(result.document))
      const property = exported['x-target'].properties.p
      expect(property.$ref).toBe('https://unreachable.test/schema')
      if (siblings) {
        expect(local(exported, property['x-extra'].$ref)).toStrictEqual({ type: 'integer' })
      } else {
        expect(property['x-extra']).toStrictEqual({ $ref: './sibling.json' })
      }
    },
  )

  it.each(
    [false, true].flatMap((customFirst) =>
      [false, true].flatMap((diagnostics) =>
        [false, true].map((treeShake) => ({ customFirst, diagnostics, treeShake })),
      ),
    ),
  )(
    'exposes custom schema targets (custom first: $customFirst, diagnostics: $diagnostics, treeShake: $treeShake)',
    async ({ customFirst, diagnostics, treeShake }) => {
      const reads: string[] = []
      const schema = { 'x-schema': { type: 'object', properties: { p: { $ref: '#/x-target' } } } }
      const target = { 'x-target': { properties: { default: { $ref: './custom.json' } } } }
      const input = { ...api, ...(customFirst ? target : schema), ...(customFirst ? schema : target) }
      const config = {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        plugins: [loader(reads)],
      } satisfies Config
      const result = diagnostics
        ? await bundleWithDiagnostics(input, config)
        : { document: await bundle(input, config) }
      if ('diagnostics' in result) expect(result.diagnostics).toStrictEqual([])
      expect(reads).toStrictEqual(['https://source.test/custom.json'])
      const exported = JSON.parse(JSON.stringify(result.document))
      expect(local(exported, exported['x-target'].properties.default.$ref)).toStrictEqual({ type: 'string' })
    },
  )

  it.each([false, true].flatMap((external) => [false, true].map((customFirst) => ({ external, customFirst }))))(
    'establishes native rules across components (external: $external, custom first: $customFirst)',
    async ({ external, customFirst }) => {
      const reads: string[] = []
      const custom = {
        A: {
          'x-target': {
            type: 'object',
            properties: {
              p: { $ref: 'https://unreachable.test/schema', 'x-extra': { $ref: './sibling.json' } },
            },
          },
        },
      }
      const native = { B: { $ref: '#/components/schemas/A/x-target' } }
      const document = {
        ...api,
        openapi: '3.0.4',
        components: { schemas: { ...(customFirst ? custom : native), ...(customFirst ? native : custom) } },
      }
      const result = await bundleWithDiagnostics(
        external ? { ...api, 'x-entry': { $ref: './external.json' } } : document,
        {
          origin: 'https://source.test/root.json',
          traversal: 'document',
          includeCustomReferences: true,
          treeShake: false,
          preserveReference: (reference) => /^https?:\/\//i.test(reference),
          plugins: [
            {
              type: 'loader',
              validate: () => true,
              exec: (uri) => {
                reads.push(uri)
                return Promise.resolve({
                  ok: true,
                  raw: '',
                  data: uri.endsWith('external.json') ? document : { type: 'integer' },
                })
              },
            },
          ],
        },
      )
      expect(result.diagnostics).toStrictEqual([])
      expect(reads).toStrictEqual(external ? ['https://source.test/external.json'] : [])
      const exported = JSON.parse(JSON.stringify(result.document))
      const bundledDocument = external ? local(exported, exported['x-entry'].$ref) : exported
      if (bundledDocument === null || typeof bundledDocument !== 'object' || !('components' in bundledDocument)) {
        throw new Error('Missing bundled API description')
      }
      const components = bundledDocument.components as { schemas: typeof custom }
      expect(components.schemas.A['x-target'].properties.p['x-extra']).toStrictEqual({ $ref: './sibling.json' })
    },
  )

  it('uses the current parent when a hook replaces an object before its custom child is visited', async () => {
    const parents: unknown[] = []
    const reads: string[] = []
    const input = {
      ...api,
      components: {
        schemas: {
          A: { type: 'object', 'x-child': { $ref: './custom.json' } },
          B: { $ref: '#/components/schemas/A' },
        },
      },
    }
    const result = await bundleWithDiagnostics(input, {
      origin: 'https://source.test/root.json',
      traversal: 'document',
      includeCustomReferences: true,
      treeShake: false,
      preserveReference: (reference) => /^https?:\/\//i.test(reference),
      plugins: [loader(reads)],
      hooks: {
        onBeforeTargetProcess: (target, { path }) =>
          path.join('/') === 'components/schemas/A' ? { value: structuredClone(target) } : undefined,
        onBeforeNodeProcess: (_node, { parentNode, path }) => {
          if (path.at(-1) === 'x-child') parents.push(parentNode)
        },
      },
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(reads).toStrictEqual(['https://source.test/custom.json'])
    expect(parents.length).toBe(1)
    expect(parents[0]).toBe(input.components.schemas.A)
  })

  it.each(['literal', 'loaded', 'cached'])(
    'inherits modern sibling rules across $id scopes from %s targets',
    async (storage) => {
      const reads: string[] = []
      const target = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $anchor: 'target',
        $ref: 'https://unreachable.test/schema',
        'x-extra': { $ref: './sibling.json' },
      }
      const original = structuredClone(target)
      const result = await bundleWithDiagnostics(
        {
          ...api,
          openapi: '3.0.4',
          ...(storage === 'literal' ? { components: { schemas: { A: { default: target } } } } : {}),
          'x-schema': {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://source.test/Owner',
            type: 'object',
            properties: {
              p: { $ref: storage === 'literal' ? './root.json#/components/schemas/A/default' : './target.json#target' },
            },
          },
        },
        {
          origin: 'https://source.test/root.json',
          traversal: 'document',
          includeCustomReferences: true,
          treeShake: false,
          urlMap: true,
          preserveReference: (reference) => /^https?:\/\//i.test(reference),
          ...(storage === 'cached'
            ? {
                cache: new Map([
                  ['https://source.test/target.json', Promise.resolve({ ok: true as const, raw: '', data: target })],
                ]),
              }
            : {}),
          plugins: [
            {
              type: 'loader',
              validate: () => true,
              exec: (uri) => {
                reads.push(uri)
                return Promise.resolve({
                  ok: true,
                  raw: '',
                  data: uri.endsWith('target.json') ? target : { type: 'integer' },
                })
              },
            },
          ],
        },
      )
      expect(result.diagnostics).toStrictEqual([])
      expect(reads).toStrictEqual([
        ...(storage === 'loaded' ? ['https://source.test/target.json'] : []),
        'https://source.test/sibling.json',
      ])
      const exported = JSON.parse(JSON.stringify(result.document))
      if (storage === 'literal') expect(exported.components.schemas.A.default).toStrictEqual(original)
      const owner = exported['x-schema']
      const schema = local(owner, owner.properties.p.$ref)
      if (schema === null || typeof schema !== 'object' || !('$ref' in schema) || !('x-extra' in schema)) {
        throw new Error('Missing exposed schema')
      }
      expect(schema.$ref).toBe('https://unreachable.test/schema')
      expect(local(owner, (schema['x-extra'] as { $ref: string }).$ref)).toStrictEqual({ type: 'integer' })
      expect(Object.values(exported['x-ext-urls'])).not.toContain('https://unreachable.test/schema')
    },
  )

  it.each(
    [
      { treeShake: false, diagnostics: false, preserve: false },
      { treeShake: true, diagnostics: false, preserve: false },
      { treeShake: false, diagnostics: true, preserve: false },
      { treeShake: true, diagnostics: true, preserve: false },
      { treeShake: false, diagnostics: false, preserve: true },
      { treeShake: true, diagnostics: false, preserve: true },
      { treeShake: false, diagnostics: true, preserve: true },
      { treeShake: true, diagnostics: true, preserve: true },
    ].flatMap((options) => ['local', 'loaded', 'cached'].map((storage) => ({ ...options, storage }))),
  )(
    'copies literal targets (treeShake: $treeShake, diagnostics: $diagnostics, preserve: $preserve, storage: $storage)',
    async ({ treeShake, diagnostics, preserve, storage }) => {
      const reads: string[] = []
      const target = {
        type: 'object',
        properties: {
          value: { $ref: './custom.json' },
          self: { $ref: `${storage === 'local' ? '' : './source.json'}#/components/schemas/A/default` },
        },
      }
      const original = structuredClone(target)
      const source = { ...api, components: { schemas: { A: { default: target } } } }
      const input = {
        ...api,
        components: {
          schemas: {
            ...(storage === 'local' ? { A: { default: target } } : {}),
            B: { $ref: `${storage === 'local' ? '' : './source.json'}#/components/schemas/A/default` },
          },
        },
      }
      const config = {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake,
        ...(storage === 'cached'
          ? {
              cache: new Map([
                ['https://source.test/source.json', Promise.resolve({ ok: true as const, raw: '', data: source })],
              ]),
            }
          : {}),
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              reads.push(uri)
              return Promise.resolve({
                ok: true,
                raw: '',
                data: uri.endsWith('/source.json') ? source : { type: 'string' },
              })
            },
          },
        ],
        ...(preserve ? { preserveReference: (reference: string) => /^https?:\/\//i.test(reference) } : {}),
      } satisfies Config
      const result = diagnostics
        ? await bundleWithDiagnostics(input, config)
        : { document: await bundle(input, config) }
      if ('diagnostics' in result) expect(result.diagnostics).toStrictEqual([])
      const exported = JSON.parse(JSON.stringify(result.document))
      expect(target).toStrictEqual(original)
      if (storage === 'local') expect(exported.components.schemas.A.default).toStrictEqual(original)
      else if (!treeShake) {
        const imported = Object.values(
          exported['x-ext'] as Record<string, { components?: { schemas: { A: { default: unknown } } } }>,
        ).find((value) => value.components)
        expect(imported?.components?.schemas.A.default).toStrictEqual(original)
      }
      const exposed = local(exported, exported.components.schemas.B.$ref)
      if (exposed === null || typeof exposed !== 'object' || !('properties' in exposed))
        throw new Error('Missing exposed schema')
      const properties = exposed.properties as Record<string, { $ref: string }>
      expect(local(exported, properties.value.$ref)).toStrictEqual({ type: 'string' })
      expect(local(exported, properties.self.$ref)).toBe(exposed)
      expect(reads).toStrictEqual([
        ...(storage === 'loaded' ? ['https://source.test/source.json'] : []),
        'https://source.test/custom.json',
      ])
    },
  )

  it('retains authored diagnostics for references in copied literal targets', async () => {
    const target = { type: 'object', properties: { value: { $ref: './missing.json' } } }
    const original = structuredClone(target)
    const result = await bundleWithDiagnostics(
      { ...api, components: { schemas: { A: { default: target }, B: { $ref: '#/components/schemas/A/default' } } } },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: true,
        plugins: [{ type: 'loader', validate: () => true, exec: () => Promise.resolve({ ok: false }) }],
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
      },
    )
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'unresolved-document',
        reference: './missing.json',
        source: 'https://source.test/root.json',
        pointer: '#/components/schemas/A/default/properties/value/$ref',
      },
    ])
    expect(JSON.parse(JSON.stringify(result.document)).components.schemas.A.default).toStrictEqual(original)
  })

  it.each(
    [false, true].flatMap((customFirst) =>
      [false, true].flatMap((treeShake) => [
        { customFirst, treeShake, diagnostics: false, previousScopeError: false },
        { customFirst, treeShake, diagnostics: true, previousScopeError: false },
        { customFirst, treeShake, diagnostics: true, previousScopeError: true },
      ]),
    ),
  )(
    'resolves late native exposures from authored references (custom first: $customFirst, treeShake: $treeShake, diagnostics: $diagnostics, previous failure: $previousScopeError)',
    async ({ customFirst, treeShake, diagnostics, previousScopeError }) => {
      const reads: string[] = []
      const target = { $id: './scoped/', $ref: './payload.json' }
      const entry = { nested: { $ref: './external.json' } }
      const input = {
        ...api,
        ...(customFirst ? { 'x-target': target, 'x-entry': entry } : { 'x-entry': entry, 'x-target': target }),
      }
      const config = {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake,
        urlMap: true,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              reads.push(uri)
              if (previousScopeError && uri.includes('/scoped/')) return Promise.resolve({ ok: false })
              return Promise.resolve({
                ok: true,
                raw: '',
                data: uri.endsWith('/external.json')
                  ? { ...api, openapi: '3.0.4', components: { schemas: { B: { $ref: './root.json#/x-target' } } } }
                  : { type: uri.includes('/scoped/') ? 'string' : 'integer' },
              })
            },
          },
        ],
      } satisfies Config
      const result = diagnostics
        ? await bundleWithDiagnostics(input, config)
        : { document: await bundle(input, config) }
      if ('diagnostics' in result) expect(result.diagnostics).toStrictEqual([])
      const exported = JSON.parse(JSON.stringify(result.document))
      const exposed = exported['x-target']
      expect(local(exported, exposed.$ref)).toStrictEqual({ type: 'integer' })
      expect(exposed.$id).toBe('./scoped/')
      const external = Object.values(
        exported['x-ext'] as Record<string, { components?: { schemas: { B: { $ref: string } } } }>,
      ).find((value) => value.components)
      if (!external?.components) throw new Error('Missing imported API description')
      expect(local(exported, external.components.schemas.B.$ref)).toBe(exposed)
      expect(reads).toContain('https://source.test/payload.json')
      if (treeShake) {
        expect(JSON.stringify(exported['x-ext'])).not.toContain('string')
        expect(Object.values(exported['x-ext-urls']).some((uri) => String(uri).includes('scoped/payload'))).toBe(false)
      }
    },
  )

  it('keeps the latest native exposure when it is discovered during an active custom load', async () => {
    const result = await bundleWithDiagnostics(
      { ...api, 'x-target': { $id: './scoped/', $ref: './external.json' } },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: true,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) =>
              Promise.resolve({
                ok: true,
                raw: '',
                data: uri.includes('/scoped/')
                  ? { ...api, openapi: '3.0.4', components: { schemas: { B: { $ref: '../root.json#/x-target' } } } }
                  : { type: 'integer' },
              }),
          },
        ],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(local(exported, exported['x-target'].$ref)).toStrictEqual({ type: 'integer' })
  })

  it('retains imported document context when custom references are disabled', async () => {
    const origin = 'https://source.test/root.json'
    const result = await bundleWithDiagnostics(
      {
        ...api,
        openapi: '3.2.0',
        $self: origin,
        paths: { '/value': { get: { responses: { '200': { $ref: './response.json' } } } } },
        components: { schemas: { A: { $anchor: 'same', type: 'string' }, B: { $ref: `${origin}#same` } } },
      },
      {
        origin,
        traversal: 'document',
        treeShake: false,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        hooks: {
          resolveDocument: (value) =>
            value !== null && typeof value === 'object' && '$self' in value && typeof value.$self === 'string'
              ? { baseUri: value.$self }
              : undefined,
        },
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: () =>
              Promise.resolve({
                ok: true,
                raw: '',
                data: {
                  description: 'Value',
                  content: { 'application/json': { schema: { $anchor: 'same', type: 'integer' } } },
                },
              }),
          },
        ],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.components.schemas.A.$anchor).toBe('same')
    expect(JSON.stringify(exported).match(/"\$anchor":"same"/g)).toStrictEqual(['"$anchor":"same"'])
    expect(exported.components.schemas.B.$ref).toBe(`${origin}#same`)
  })

  it('keeps strict document traversal unchanged when custom references are not enabled', async () => {
    const reads: string[] = []
    const result = await bundleWithDiagnostics(fixture(), {
      origin: 'https://source.test/root.json',
      traversal: 'document',
      plugins: [loader(reads)],
      treeShake: false,
      preserveReference: (reference) => /^https?:\/\//i.test(reference),
    })
    expect(result.complete).toBe(true)
    expect(reads).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported['x-entry']).toStrictEqual(fixture()['x-entry'])
    expect(exported.components.schemas.A.custom).toStrictEqual({ $ref: './local.json' })
    expect(exported.components.schemas.A['x-resource']).toStrictEqual(fixture().components.schemas.A['x-resource'])
  })

  it('ignores the custom-reference option during generic traversal', async () => {
    const run = async (
      includeCustomReferences: boolean,
    ): Promise<{
      reads: string[]
      result: Awaited<ReturnType<typeof bundleWithDiagnostics>>
    }> => {
      const reads: string[] = []
      const result = await bundleWithDiagnostics(
        { ...api, 'x-extra': { example: { $ref: './custom.json' }, missing: { $ref: './missing.json' } } },
        {
          origin: 'https://source.test/root.json',
          traversal: 'generic',
          includeCustomReferences,
          treeShake: true,
          urlMap: true,
          plugins: [loader(reads)],
        },
      )
      return { reads, result }
    }
    const baseline = await run(false)
    expect(baseline.reads).toStrictEqual(['https://source.test/custom.json', 'https://source.test/missing.json'])
    expect(baseline.result.diagnostics).toStrictEqual([
      {
        kind: 'unresolved-document',
        reference: './missing.json',
        source: 'https://source.test/root.json',
        pointer: '#/x-extra/missing/$ref',
      },
    ])
    expect(await run(true)).toStrictEqual(baseline)
  })

  it('shows which custom-only targets standalone pruning misses after bundling', async () => {
    const origin = 'https://source.test/root.json'
    const extension = { $ref: './custom.json' }
    const literalReference = { $ref: '#/x-example/value' }
    const schema = { type: 'string', customKeyword: { $ref: './sibling.json' } }
    const document = {
      ...api,
      'x-entry': extension,
      'x-copy': literalReference,
      'x-example': { value: { type: 'boolean' } },
      paths: {
        '/value': {
          get: { responses: { 200: { description: 'OK', content: { 'application/json': { schema } } } } },
        },
      },
    }
    const result = await bundleWithDiagnostics(document, {
      origin,
      traversal: 'document',
      includeCustomReferences: true,
      treeShake: true,
      plugins: [loader([])],
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.pruning).toBe('applied')
    expect(local(document, extension.$ref)).toStrictEqual({ type: 'string' })
    expect(local(document, literalReference.$ref)).toStrictEqual({ type: 'boolean' })
    expect(local(document, schema.customKeyword.$ref)).toStrictEqual({ type: 'integer' })

    const copy = structuredClone(document)
    expect(checkDocument(copy, { origin, prune: true }).ok).toBe(true)
    expect(local(copy, extension.$ref)).toBeUndefined()
    expect(local(copy, literalReference.$ref)).toBeUndefined()
    expect(local(copy, schema.customKeyword.$ref)).toBeUndefined()
  })

  it.each([false, true].flatMap((treeShake) => [false, true].map((diagnostics) => ({ treeShake, diagnostics }))))(
    'resolves custom positions and literals (treeShake: $treeShake, diagnostics: $diagnostics)',
    async ({ treeShake, diagnostics }) => {
      const reads: string[] = []
      const config = {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        plugins: [loader(reads)],
        treeShake,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
      } satisfies Config
      const result = diagnostics
        ? await bundleWithDiagnostics(fixture(), config)
        : { document: await bundle(fixture(), config) }
      if ('diagnostics' in result) expect(result.diagnostics).toStrictEqual([])
      expect(reads.sort()).toStrictEqual(Object.keys(documents).sort())
      const exported = JSON.parse(JSON.stringify(result.document))
      expect(local(exported, exported['x-entry'].$ref)).toStrictEqual({ type: 'string' })
      expect(local(exported, exported['x-entry'].sibling.$ref)).toStrictEqual({ type: 'integer' })
      expect(exported['x-entry'].value).toStrictEqual(literal)
      const a = exported.components.schemas.A
      expect(a.$id).toBe('https://source.test/schemas/A.json')
      expect(a.default).toStrictEqual(literal)
      expect(a.examples).toStrictEqual([literal])
      expect(a.enum).toStrictEqual([literal])
      expect(a.const).toStrictEqual(literal)
      const customUri = new URL(a.custom.$ref, a.$id)
      expect(customUri.href.split('#')[0]).toBe(a.$id)
      const custom = local(a, customUri.href)
      if (custom === null || typeof custom !== 'object' || !('properties' in custom))
        throw new Error('Missing custom schema')
      expect('type' in custom ? custom.type : undefined).toBe('object')
      expect(local(a, (custom.properties as { shared: { $ref: string } }).shared.$ref)).toStrictEqual({
        type: 'boolean',
        examples: [literal],
      })
      const resource = a['x-resource']
      expect(resource.$id).toBe('https://source.test/X.json')
      expect(resource.$anchor).toBe('same')
      expect(resource.default).toStrictEqual(literal)
      const payloadUri = new URL(resource.$ref, resource.$id)
      expect(payloadUri.href.split('#')[0]).toBe(resource.$id)
      const payload = local(resource, payloadUri.href)
      expect(local(resource, resource.sibling.$ref)).toStrictEqual({ type: 'integer' })
      expect(local(resource, resource.native.$ref)).toStrictEqual({ type: 'boolean', examples: [literal] })
      if (payload === null || typeof payload !== 'object' || !('properties' in payload))
        throw new Error('Missing custom payload')
      expect('type' in payload ? payload.type : undefined).toBe('object')
      const properties = payload.properties as Record<string, { $ref: string }>
      expect(properties.back?.$ref).toBe(a.$id)
      expect(properties.remote?.$ref).toBe('HTTPS://unreachable.test/schema#same')
      expect(exported.$id).toBeUndefined()
    },
  )

  it('keeps custom siblings and anchors when copying anonymous dependencies into a named extension', async () => {
    const reads: string[] = []
    const result = await bundleWithDiagnostics(
      {
        ...api,
        'x-owner': {
          $id: 'https://source.test/Owner',
          $anchor: 'same',
          responses: { R: { $ref: './response.json' } },
        },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        includeCustomReferences: true,
        treeShake: false,
        preserveReference: (reference) => /^https?:\/\//i.test(reference),
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              reads.push(uri)
              return Promise.resolve(
                uri.endsWith('/response.json')
                  ? {
                      ok: true,
                      raw: '',
                      data: {
                        $anchor: 'same',
                        $ref: 'https://unreachable.test/response',
                        sibling: { $ref: './sibling.json' },
                        default: literal,
                      },
                    }
                  : { ok: true, raw: '', data: { type: 'integer' } },
              )
            },
          },
        ],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(reads.sort()).toStrictEqual(['https://source.test/response.json', 'https://source.test/sibling.json'])
    const owner = JSON.parse(JSON.stringify(result.document))['x-owner']
    const response = local(owner, owner.responses.R.$ref)
    expect(response).toStrictEqual({
      $ref: 'https://unreachable.test/response',
      sibling: { $ref: expect.any(String) },
      default: literal,
    })
    if (response === null || typeof response !== 'object' || !('sibling' in response))
      throw new Error('Missing response')
    expect(response).not.toHaveProperty('$anchor')
    expect(local(owner, (response.sibling as { $ref: string }).$ref)).toStrictEqual({ type: 'integer' })
    expect(owner.$anchor).toBe('same')
  })

  it.each(['3.0.4', '3.1.0'])(
    'visits custom reference siblings while retaining standard sibling rules in OpenAPI %s',
    async (openapi) => {
      const reads: string[] = []
      const result = await bundleWithDiagnostics(
        {
          ...api,
          openapi,
          'x-custom': { $ref: 'https://unreachable.test/schema', sibling: { $ref: './sibling.json' } },
          components: {
            parameters: {
              P: { $ref: 'https://unreachable.test/parameter', ignored: { $ref: './ignored.json' } },
            },
          },
        },
        {
          origin: 'https://source.test/root.json',
          traversal: 'document',
          includeCustomReferences: true,
          treeShake: false,
          plugins: [loader(reads)],
          preserveReference: (reference) => /^https?:\/\//i.test(reference),
        },
      )
      expect(result.complete).toBe(true)
      expect(reads).toStrictEqual(['https://source.test/sibling.json'])
      const exported = JSON.parse(JSON.stringify(result.document))
      expect(exported['x-custom'].$ref).toBe('https://unreachable.test/schema')
      expect(local(exported, exported['x-custom'].sibling.$ref)).toStrictEqual({ type: 'integer' })
      expect(exported.components.parameters.P.ignored.$ref).toBe('./ignored.json')
    },
  )
})
