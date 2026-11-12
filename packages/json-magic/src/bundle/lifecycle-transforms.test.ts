import { describe, expect, it } from 'vitest'

import { type LoaderPlugin, type ResolveResult, bundle } from './bundle'

const resource = { legacy: { type: 'string' } }
const loader: LoaderPlugin = {
  type: 'loader',
  validate: (uri) => uri === 'https://example.com/model.json',
  exec: () => Promise.resolve({ ok: true, data: structuredClone(resource), raw: JSON.stringify(resource) }),
}

describe('lifecycle-transforms', () => {
  it('transforms an external resource before resolving its relocated target', async () => {
    const input = { model: { $ref: './model.json#/legacy' } }
    const loaded: string[] = []
    const result = await bundle(input, {
      origin: 'https://example.com/api.json',
      treeShake: false,
      compress: () => 'model',
      plugins: [
        loader,
        {
          type: 'lifecycle',
          onDocumentLoaded: (value, context) => {
            loaded.push(context.uri)
            return context.uri.endsWith('model.json') ? { modern: resource.legacy } : value
          },
          resolveDocument: (_value, uri) =>
            uri.endsWith('model.json')
              ? {
                  baseUri: uri,
                  remapPointer: (pointer) => (pointer[0] === 'legacy' ? ['modern', ...pointer.slice(1)] : pointer),
                }
              : undefined,
        },
      ],
    })
    expect(loaded).toStrictEqual(['https://example.com/api.json', 'https://example.com/model.json'])
    expect(result).toStrictEqual({
      model: { $ref: '#/x-ext/model/modern' },
      'x-ext': { model: { modern: { type: 'string' } } },
    })
  })

  it('runs loaded-resource transforms on supplied cache entries without refetching', async () => {
    const cache = new Map<string, Promise<ResolveResult>>([
      ['https://example.com/model.json', Promise.resolve({ ok: true, data: resource, raw: JSON.stringify(resource) })],
    ])
    const loaded: string[] = []
    const input = { model: { $ref: './model.json#/legacy' } }
    await bundle(input, {
      origin: 'https://example.com/api.json',
      treeShake: false,
      cache,
      plugins: [
        {
          type: 'lifecycle',
          onDocumentLoaded: (value, { uri }) => {
            loaded.push(uri)
            return value
          },
        },
      ],
    })
    expect(loaded).toStrictEqual(['https://example.com/api.json', 'https://example.com/model.json'])
    expect(Object.keys(input)).toStrictEqual(['model', 'x-ext'])
  })

  it('stores context-dependent target transformations without replacing their source', async () => {
    const input = { first: { $ref: './model.json#/legacy' }, second: { $ref: './model.json#/legacy' } }
    const result = await bundle(input, {
      origin: 'https://example.com/api.json',
      treeShake: false,
      compress: () => 'model',
      plugins: [
        loader,
        {
          type: 'lifecycle',
          onBeforeTargetProcess: (target, { referencedFrom }) => ({
            value: { ...(target as object), title: referencedFrom.path[0] },
            path: ['converted', referencedFrom.path[0]!],
          }),
        },
      ],
    })
    expect(result).toStrictEqual({
      first: { $ref: '#/x-ext/model/converted/first' },
      second: { $ref: '#/x-ext/model/converted/second' },
      'x-ext': {
        model: {
          legacy: { type: 'string' },
          converted: { first: { type: 'string', title: 'first' }, second: { type: 'string', title: 'second' } },
        },
      },
    })
  })
})
