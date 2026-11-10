import { describe, expect, it } from 'vitest'

import { CHUNK_INDEX_KEY, type ChunkIndex, buildChunkIndex, chunkRefTemplates, expandChunkIndex } from './chunk-index'

describe('chunk-index', () => {
  it.each(['static', 'ssr'] as const)('round-trips Paths Object extensions in %s mode', (mode) => {
    const paths = JSON.parse(
      '{"x-array":["origin"],"x-null":null,"x-false":false,"x-zero":0,"x-object":{"get":{"summary":"metadata"}}}',
    )
    const document: Record<string, unknown> = {
      [CHUNK_INDEX_KEY]: buildChunkIndex({
        mode,
        refs: chunkRefTemplates({ mode, name: 'doc', baseUrl: '/docs' }),
        components: {},
        paths,
      }),
    }
    expect(expandChunkIndex(document)).toBe(true)
    expect(document['paths']).toStrictEqual(paths)
  })

  it.each(['static', 'ssr'] as const)('preserves security schemes alongside chunked entries in %s mode', (mode) => {
    const securitySchemes = JSON.parse(
      '{"token":{"type":"http","scheme":"bearer"},"alias":{"$ref":"#/components/securitySchemes/token"},"__proto__":{"type":"http","scheme":"basic"}}',
    )
    const document: Record<string, unknown> = {
      components: {
        securitySchemes,
        schemas: { Inline: { type: 'string' }, Unindexed: { type: 'number' } },
        responses: { Inline: { description: 'Inline response' } },
      },
      [CHUNK_INDEX_KEY]: {
        mode,
        refs: chunkRefTemplates({ mode, name: 'doc', baseUrl: 'https://example.com' }),
        components: { securitySchemes: ['token', 'remote'], schemas: ['Inline'] },
        paths: { '/users': { get: 0 } },
      } satisfies ChunkIndex,
    }

    expect(expandChunkIndex(document)).toBe(true)
    const components = document['components'] as Record<string, Record<string, unknown>>
    const base = mode === 'static' ? './chunks/doc' : 'https://example.com/doc'
    const suffix = mode === 'static' ? '.json#' : '#'
    expect(components).toStrictEqual({
      securitySchemes: {
        ...securitySchemes,
        remote: { $ref: `${base}/components/securitySchemes/remote${suffix}`, $global: true },
      },
      schemas: { Inline: { $ref: `${base}/components/schemas/Inline${suffix}`, $global: true } },
    })
    expect(Object.getPrototypeOf(components['securitySchemes'])).toBe(Object.prototype)
    expect(Object.hasOwn(components['securitySchemes'] ?? {}, '__proto__')).toBe(true)
    expect(document['paths']).toStrictEqual({
      '/users': { get: { $ref: `${base}/operations/~1users/get${suffix}`, $global: true } },
    })
    expect(Object.hasOwn(document, CHUNK_INDEX_KEY)).toBe(false)
    expect(Object.hasOwn(securitySchemes, 'remote')).toBe(false)
  })

  it.each(['static', 'ssr'] as const)('preserves security schemes absent from the chunk index in %s mode', (mode) => {
    const securitySchemes = { token: { type: 'http', scheme: 'bearer' } }
    const document: Record<string, unknown> = {
      components: { securitySchemes },
      [CHUNK_INDEX_KEY]: {
        mode,
        refs: chunkRefTemplates({ mode, name: 'doc', baseUrl: 'https://example.com' }),
        components: {},
        paths: {},
      } satisfies ChunkIndex,
    }

    expect(expandChunkIndex(document)).toBe(true)
    expect(document).toStrictEqual({ components: { securitySchemes }, paths: {} })
  })

  it.each(['static', 'ssr'] as const)('preserves prototype-related keys as own properties in %s mode', (mode) => {
    const keys = ['__proto__', 'constructor', 'prototype']
    const pathItem = JSON.parse('{"__proto__":{"polluted":true},"constructor":"data","prototype":"data","get":0}')
    const index: ChunkIndex = {
      mode,
      refs: chunkRefTemplates({ mode, name: 'doc', baseUrl: 'https://example.com' }),
      components: Object.fromEntries(['schemas', 'securitySchemes', ...keys].map((key) => [key, keys])),
      paths: Object.fromEntries(['/users', ...keys].map((key) => [key, pathItem])),
    }
    const document: Record<string, unknown> = { [CHUNK_INDEX_KEY]: index }

    expect(expandChunkIndex(document)).toBe(true)
    expect(Object.hasOwn(document, CHUNK_INDEX_KEY)).toBe(false)

    const components = document['components'] as Record<string, Record<string, unknown>>
    expect(Object.getPrototypeOf(components)).toBe(Object.prototype)
    expect(Object.keys(components)).toStrictEqual(['schemas', 'securitySchemes', ...keys])
    for (const [type, entries] of Object.entries(components)) {
      expect(Object.getPrototypeOf(entries)).toBe(Object.prototype)
      expect(Object.keys(entries)).toStrictEqual(keys)
      for (const key of keys) {
        expect(entries[key]).toStrictEqual({
          $ref:
            mode === 'static'
              ? `./chunks/doc/components/${type}/${key}.json#`
              : `https://example.com/doc/components/${type}/${key}#`,
          $global: true,
        })
      }
    }

    const paths = document['paths'] as Record<string, Record<string, unknown>>
    expect(Object.getPrototypeOf(paths)).toBe(Object.prototype)
    expect(Object.keys(paths)).toStrictEqual(['/users', ...keys])
    for (const entries of Object.values(paths)) {
      expect(Object.getPrototypeOf(entries)).toBe(Object.prototype)
      expect(Object.keys(entries)).toStrictEqual([...keys, 'get'])
      expect(entries['__proto__']).toStrictEqual({ polluted: true })
      expect(entries['constructor']).toBe('data')
      expect(entries['prototype']).toBe('data')
    }
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false)
  })
})
