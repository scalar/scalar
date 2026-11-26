import { describe, expect, it, vi } from 'vitest'

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
  it('retains an own __proto__ storage key when a loaded resource is transformed', async () => {
    const input = JSON.parse('{"x-ext":{"__proto__":{"legacy":{"type":"string"}}}}')
    const stored = input['x-ext']
    await bundle(input, {
      treeShake: false,
      plugins: [
        {
          type: 'lifecycle',
          onDocumentLoaded: (document, { uri }) => (uri.includes('__proto__') ? { modern: resource.legacy } : document),
          resolveDocument: (_document, uri) =>
            uri.includes('__proto__')
              ? {
                  baseUri: uri,
                  remapPointer: (pointer) => (pointer[0] === 'legacy' ? ['modern', ...pointer.slice(1)] : pointer),
                }
              : undefined,
        },
      ],
    })
    expect(Object.getPrototypeOf(stored)).toBe(Object.prototype)
    expect(Object.hasOwn(stored, '__proto__')).toBe(true)
    expect(stored.__proto__).toStrictEqual({ modern: { type: 'string' } })
    expect(Object.prototype).not.toHaveProperty('modern')
  })

  it('does not clone a root when loaded-resource hooks leave it unchanged', async () => {
    const input = { title: 'Already upgraded', paths: {} }
    const clone = vi.spyOn(globalThis, 'structuredClone')
    try {
      await bundle(input, { treeShake: false, plugins: [{ type: 'lifecycle', onDocumentLoaded: (value) => value }] })
      expect(clone.mock.calls.some(([value]) => value === input)).toBe(false)
    } finally {
      clone.mockRestore()
    }
  })
})
