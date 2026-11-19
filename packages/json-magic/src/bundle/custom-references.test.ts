import { describe, expect, it } from 'vitest'

import { getSegmentsFromPath } from '@/helpers/get-segments-from-path'
import { getValueByPath } from '@/helpers/get-value-by-path'

import type { LoaderPlugin } from './bundle'
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
    return Promise.resolve(data ? { ok: true, data, raw: '' } : { ok: false })
  },
})

const local = (resource: object, reference: string): unknown =>
  getValueByPath(
    resource,
    getSegmentsFromPath(decodeURIComponent(new URL(reference, 'https://output.test/root.json').hash)),
  ).value

describe('custom-references', () => {
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

  it.each([false, true])('resolves custom positions and retains literal data (treeShake: %s)', async (treeShake) => {
    const reads: string[] = []
    const result = await bundleWithDiagnostics(fixture(), {
      origin: 'https://source.test/root.json',
      traversal: 'document',
      includeCustomReferences: true,
      plugins: [loader(reads)],
      treeShake,
      preserveReference: (reference) => /^https?:\/\//i.test(reference),
    })
    expect(result.diagnostics).toStrictEqual([])
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
  })

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
