import { describe, expect, it } from 'vitest'

import { CHUNK_INDEX_KEY, type ChunkIndex, chunkRefTemplates, expandChunkIndex } from './chunk-index'

describe('chunk-index', () => {
  it.each(['static', 'ssr'] as const)('preserves prototype-related keys as own properties in %s mode', (mode) => {
    const keys = ['__proto__', 'constructor', 'prototype']
    const pathItem = JSON.parse('{"__proto__":{"polluted":true},"constructor":"data","prototype":"data","get":0}')
    const index: ChunkIndex = {
      mode,
      refs: chunkRefTemplates({ mode, name: 'doc', baseUrl: 'https://example.com' }),
      components: Object.fromEntries(['schemas', ...keys].map((key) => [key, keys])),
      paths: Object.fromEntries(['/users', ...keys].map((key) => [key, pathItem])),
    }
    const document: Record<string, unknown> = { [CHUNK_INDEX_KEY]: index }

    expect(expandChunkIndex(document)).toBe(true)
    expect(Object.hasOwn(document, CHUNK_INDEX_KEY)).toBe(false)

    const components = document['components'] as Record<string, Record<string, unknown>>
    expect(Object.getPrototypeOf(components)).toBe(Object.prototype)
    expect(Object.keys(components)).toStrictEqual(['schemas', ...keys])
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
