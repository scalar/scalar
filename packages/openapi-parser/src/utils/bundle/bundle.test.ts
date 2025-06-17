import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bundle,
  getNestedValue,
  isLocalRef,
  isRemoteUrl,
  prefixInternalRef,
  prefixInternalRefRecursive,
  setValueAtPath,
} from './bundle'
import { fetchUrls } from './plugins/fetch-urls'
import { readFiles } from './plugins/read-files'
import { setTimeout } from 'node:timers/promises'
import { parseJson } from '@/utils/bundle/plugins/parse-json'
import { parseYaml } from '@/utils/bundle/plugins/parse-yaml'
import YAML from 'yaml'
import { getHash } from '@/utils/bundle/value-generator'

describe('bundle', () => {
  describe('external urls', () => {
    let server: FastifyInstance
    const PORT = 7289

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('bundles external urls', async () => {
      const url = `http://localhost:${PORT}`

      const external = {
        prop: 'I am external json prop',
      }
      server.get('/', (_, reply) => {
        reply.send(external)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          '$ref': `http://localhost:${PORT}#/prop`,
        },
      }

      await bundle(input, {
        plugins: [fetchUrls(), readFiles()],
        treeShake: false,
      })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            ...external,
          },
        },
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: `#/x-ext/${await getHash(url)}/prop`,
        },
      })
    })

    it('bundles external urls from resolved external piece', async () => {
      const url = `http://localhost:${PORT}`
      const chunk2 = {
        hey: 'hey',
        nested: {
          key: 'value',
        },
        internal: '#/nested/key',
      }

      const chunk1 = {
        a: {
          hello: 'hello',
        },
        b: {
          '$ref': `${url}/chunk2#`,
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })
      server.get('/chunk2', (_, reply) => {
        reply.send(chunk2)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          b: {
            c: {
              '$ref': `${url}/chunk1#`,
            },
          },
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            ...chunk1,
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/chunk2`)}`,
            },
          },
          [await getHash(`${url}/chunk2`)]: {
            ...chunk2,
            internal: '#/nested/key',
          },
        },
        a: {
          b: {
            c: {
              $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
            },
          },
        },
      })
    })

    it('should correctly handle only urls without a pointer', async () => {
      const url = `http://localhost:${PORT}`

      server.get('/', (_, reply) => {
        reply.send({
          a: 'a',
        })
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          b: {
            '$ref': `${url}`,
          },
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            a: 'a',
          },
        },
        a: {
          b: {
            $ref: `#/x-ext/${await getHash(url)}`,
          },
        },
      })
    })

    it('caches results for same resource', async () => {
      const fn = vi.fn()
      const url = `http://localhost:${PORT}`

      server.get('/', (_, reply) => {
        fn()
        reply.send({
          a: 'a',
          b: 'b',
        })
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          '$ref': `${url}#/a`,
        },
        b: {
          '$ref': `${url}#/b`,
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            a: 'a',
            b: 'b',
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(url)}/a`,
        },
        b: {
          $ref: `#/x-ext/${await getHash(url)}/b`,
        },
      })

      // We expect the bundler to cache the result for the same url
      expect(fn.mock.calls.length).toBe(1)
    })

    it('handles correctly external nested refs', async () => {
      const url = `http://localhost:${PORT}`

      server.get('/nested/another-file.json', (_, reply) => {
        reply.send({
          c: 'c',
        })
      })

      server.get('/nested/chunk1.json', (_, reply) => {
        reply.send({
          b: {
            '$ref': './another-file.json#',
          },
        })
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          '$ref': `${url}/nested/chunk1.json#`,
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(`${url}/nested/another-file.json`)]: {
            c: 'c',
          },
          [await getHash(`${url}/nested/chunk1.json`)]: {
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/nested/another-file.json`)}`,
            },
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/nested/chunk1.json`)}`,
        },
      })
    })

    it('does not merge paths when we use absolute urls', async () => {
      const url = `http://localhost:${PORT}`

      server.get('/top-level', (_, reply) => {
        reply.send({
          c: 'c',
        })
      })

      server.get('/nested/chunk1.json', (_, reply) => {
        reply.send({
          b: {
            '$ref': `${url}/top-level#`,
          },
        })
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          '$ref': `${url}/nested/chunk1.json`,
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(`${url}/top-level`)]: {
            c: 'c',
          },
          [await getHash(`${url}/nested/chunk1.json`)]: {
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/top-level`)}`,
            },
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/nested/chunk1.json`)}`,
        },
      })
    })

    it('bundles from a url input', async () => {
      const url = `http://localhost:${PORT}`

      server.get('/top-level', (_, reply) => {
        reply.send({
          c: 'c',
        })
      })

      server.get('/nested/chunk1.json', (_, reply) => {
        reply.send({
          b: {
            '$ref': `${url}/top-level#`,
          },
        })
      })

      server.get('/base/openapi.json', (_, reply) => {
        reply.send({
          a: {
            $ref: '../nested/chunk1.json',
          },
        })
      })

      await server.listen({ port: PORT })

      const output = await bundle(`${url}/base/openapi.json`, { plugins: [fetchUrls()], treeShake: false })

      expect(output).toEqual({
        'x-ext': {
          [await getHash(`${url}/top-level`)]: {
            c: 'c',
          },
          [await getHash(`${url}/nested/chunk1.json`)]: {
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/top-level`)}`,
            },
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/nested/chunk1.json`)}`,
        },
      })
    })

    it('generated a map when we turn the urlMap on', async () => {
      const url = `http://localhost:${PORT}`

      server.get('/top-level', (_, reply) => {
        reply.send({
          c: 'c',
        })
      })

      server.get('/nested/chunk1.json', (_, reply) => {
        reply.send({
          b: {
            '$ref': `${url}/top-level#`,
          },
        })
      })

      server.get('/base/openapi.json', (_, reply) => {
        reply.send({
          a: {
            $ref: '../nested/chunk1.json',
          },
        })
      })

      await server.listen({ port: PORT })

      const output = await bundle(`${url}/base/openapi.json`, {
        plugins: [fetchUrls()],
        treeShake: false,
        urlMap: true,
      })

      expect(output).toEqual({
        'x-ext': {
          [await getHash(`${url}/top-level`)]: {
            c: 'c',
          },
          [await getHash(`${url}/nested/chunk1.json`)]: {
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/top-level`)}`,
            },
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/top-level`)]: `${url}/top-level`,
          [await getHash(`${url}/nested/chunk1.json`)]: `${url}/nested/chunk1.json`,
        },
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/nested/chunk1.json`)}`,
        },
      })
    })

    it('prefixes the refs only once', async () => {
      const url = `http://localhost:${PORT}`

      const chunk2 = {
        a: 'a',
        b: {
          '$ref': `${url}/chunk1#`,
        },
      }
      const chunk1 = {
        a: {
          hello: 'hello',
        },
        b: {
          '$ref': `${url}/chunk2#`,
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })
      server.get('/chunk2', (_, reply) => {
        reply.send(chunk2)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          b: {
            c: {
              '$ref': `${url}/chunk1#`,
            },
            d: {
              e: {
                f: {
                  g: {
                    '$ref': `${url}/chunk1#`,
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, { plugins: [fetchUrls()], treeShake: false })

      expect(input).toEqual({
        a: {
          b: {
            c: {
              $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
            },
            d: {
              e: {
                f: {
                  g: {
                    $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
                  },
                },
              },
            },
          },
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              hello: 'hello',
            },
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/chunk2`)}`,
            },
          },
          [await getHash(`${url}/chunk2`)]: {
            a: 'a',
            b: {
              $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
            },
          },
        },
      })
    })

    it('bundles array references', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: [
          {
            $ref: `${url}/chunk1#`,
          },
        ],
      }
      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
      })

      expect(input).toEqual({
        a: [
          {
            $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
          },
        ],
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              hello: 'hello',
            },
          },
        },
      })
    })

    it('bundles subpart of the document', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }

      const fn = vi.fn()

      server.get('/chunk1', (_, reply) => {
        fn()
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#`,
        },
        b: {
          $ref: `${url}/chunk1#`,
        },
        c: {
          $ref: `${url}/chunk1#`,
        },
      }

      const cache = new Map()

      // Bundle only partial
      await bundle(input.b, {
        plugins: [fetchUrls()],
        treeShake: false,
        root: input,
        cache,
      })

      expect(input).toEqual({
        a: {
          $ref: `${url}/chunk1#`,
        },
        b: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        c: {
          $ref: `${url}/chunk1#`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              hello: 'hello',
            },
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/chunk1`)]: `${url}/chunk1`,
        },
      })

      // Bundle only partial
      await bundle(input.c, {
        plugins: [fetchUrls()],
        treeShake: false,
        root: input,
        cache,
      })

      expect(input).toEqual({
        a: {
          $ref: `${url}/chunk1#`,
        },
        b: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        c: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              hello: 'hello',
            },
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/chunk1`)]: `${url}/chunk1`,
        },
      })

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('always emits the url mappings when doing partial bundle', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#`,
        },
        b: {
          $ref: `${url}/chunk1#`,
        },
        c: {
          $ref: `${url}/chunk1#`,
        },
      }

      const cache = new Map()

      // Bundle only partial
      await bundle(input.b, {
        plugins: [fetchUrls()],
        treeShake: false,
        root: input,
        cache,
        urlMap: false, // Set the urlMapping to false
      })

      expect(input).toEqual({
        a: {
          $ref: `${url}/chunk1#`,
        },
        b: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        c: {
          $ref: `${url}/chunk1#`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              hello: 'hello',
            },
          },
        },
        // It should still inject the mappings on the output document
        'x-ext-urls': {
          [await getHash(`${url}/chunk1`)]: `${url}/chunk1`,
        },
      })
    })

    it('tree shakes the external documents correctly', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        a: {
          b: {
            hello: 'hello',
            g: {
              $ref: '#/d/e',
            },
          },
          c: 'c',
        },
        d: {
          e: { message: 'I should be included' },
          f: { message: 'I should be excluded on the final bundle' },
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#/a/b`,
        },
      }

      await bundle(input, { plugins: [fetchUrls()], treeShake: true })

      expect(input).toEqual({
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/a/b`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              b: {
                g: {
                  $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/d/e`,
                },
                hello: 'hello',
              },
            },
            d: {
              e: { message: 'I should be included' },
            },
          },
        },
      })
    })

    it('tree shakes correctly when working with nested external refs', async () => {
      const url = `http://localhost:${PORT}`

      const chunk2 = {
        a: {
          b: {
            hello: 'hello',
          },
          hi: 'hi',
        },
      }

      const chunk1 = {
        a: {
          b: {
            hello: 'hello',
            g: {
              $ref: '#/d/e',
            },
          },
          c: 'c',
          external: {
            $ref: './chunk2#/a/b',
          },
        },
        d: {
          e: { message: 'I should be included' },
          f: { message: 'I should be excluded on the final bundle' },
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      server.get('/chunk2', (_, reply) => {
        reply.send(chunk2)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#/a`,
        },
      }

      await bundle(input, { plugins: [fetchUrls()], treeShake: true })

      expect(input).toEqual({
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/a`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              b: {
                g: {
                  $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/d/e`,
                },
                hello: 'hello',
              },
              c: 'c',
              'external': {
                $ref: `#/x-ext/${await getHash(`${url}/chunk2`)}/a/b`,
              },
            },
            d: {
              e: {
                'message': 'I should be included',
              },
            },
          },
          [await getHash(`${url}/chunk2`)]: {
            a: {
              b: {
                hello: 'hello',
              },
            },
          },
        },
      })
    })

    it('handles circular references when we treeshake', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        a: {
          b: {
            hello: 'hello',
            g: {
              $ref: '#/a/external',
            },
          },
          c: 'c',
          external: {
            $ref: '#/a/b',
          },
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#/a`,
        },
      }

      await bundle(input, { plugins: [fetchUrls()], treeShake: true })

      expect(input).toEqual({
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/a`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              b: {
                g: {
                  $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/a/external`,
                },
                hello: 'hello',
              },
              c: 'c',
              external: {
                $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}/a/b`,
              },
            },
          },
        },
      })
    })

    it('handles chunks', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        description: 'Chunk 1',
        someRef: {
          $ref: '#/components/User',
        },
      }

      const chunk2 = {
        description: 'Chunk 2',
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })
      server.get('/chunk2', (_, reply) => {
        reply.send(chunk2)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#`,
          $global: true,
        },
        b: {
          $ref: `${url}/chunk2#`,
          $global: true,
        },
        c: {
          $ref: `${url}/chunk1#`,
          $global: true,
        },
        components: {
          User: {
            id: 'number',
            name: {
              $ref: '#/a',
            },
            another: {
              $ref: '#/b',
            },
          },
        },
      }

      // Bundle only partial
      await bundle(input.a, {
        plugins: [fetchUrls()],
        treeShake: false,
        root: input,
      })

      expect(input).toEqual({
        a: {
          $global: true,
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        b: {
          $global: true,
          $ref: `#/x-ext/${await getHash(`${url}/chunk2`)}`,
        },
        c: {
          $global: true,
          $ref: `${url}/chunk1#`,
        },
        components: {
          User: {
            another: {
              $ref: '#/b',
            },
            id: 'number',
            name: {
              $ref: '#/a',
            },
          },
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            description: 'Chunk 1',
            someRef: {
              $ref: '#/components/User',
            },
          },
          [await getHash(`${url}/chunk2`)]: {
            description: 'Chunk 2',
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/chunk2`)]: `${url}/chunk2`,
          [await getHash(`${url}/chunk1`)]: `${url}/chunk1`,
        },
      })
    })

    it('when bundle partial document we ensure all the dependencies references are resolved', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }
      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#`,
        },
        b: {
          a: 'a',
          someReference: {
            $ref: '#/a',
          },
        },
        c: {
          $ref: `${url}/chunk2#`,
        },
      }

      const cache = new Map()

      // Bundle only partial
      await bundle(input.b, {
        plugins: [fetchUrls()],
        treeShake: false,
        root: input,
        cache,
      })

      expect(input).toEqual({
        a: {
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        b: {
          a: 'a',
          someReference: {
            $ref: '#/a',
          },
        },
        c: {
          $ref: `${url}/chunk2#`,
        },
        'x-ext': {
          [await getHash(`${url}/chunk1`)]: {
            a: {
              hello: 'hello',
            },
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/chunk1`)]: 'http://localhost:7289/chunk1',
        },
      })
    })

    it('should correctly handle nested chunk urls', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        chunk1: 'chunk1',
        someRef: {
          $ref: '#/b',
        },
      }

      const chunk2 = {
        chunk2: 'chunk2',
        someRef: {
          $ref: '#/c',
        },
      }

      const chunk3 = {
        chunk3: 'chunk3',
      }
      const external = {
        external: 'external',
        someChunk: {
          $ref: '/chunk3',
          $global: true,
        },
      }
      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })
      server.get('/chunk2', (_, reply) => {
        reply.send(chunk2)
      })
      server.get('/external/chunk3', (_, reply) => {
        reply.send(chunk3)
      })
      server.get('/chunk3', (_, reply) => {
        reply.send(chunk3)
      })
      server.get('/external/document.json', (_, reply) => {
        reply.send(external)
      })

      await server.listen({ port: PORT })

      const input = {
        c: {
          $ref: `${url}/external/document.json`,
        },
        b: {
          $ref: `${url}/chunk2#`,
          $global: true,
        },
        a: {
          $ref: `${url}/chunk1#`,
          $global: true,
        },
        entry: {
          $ref: '#/a',
        },
        nonBundle: {
          $ref: `${url}/chunk1#`,
        },
      }

      const cache = new Map()

      // Bundle only partial
      await bundle(input.entry, {
        plugins: [fetchUrls()],
        treeShake: false,
        root: input,
        cache,
        urlMap: true,
      })

      expect(input).toEqual({
        a: {
          $global: true,
          $ref: `#/x-ext/${await getHash(`${url}/chunk1`)}`,
        },
        b: {
          $global: true,
          $ref: `#/x-ext/${await getHash(`${url}/chunk2`)}`,
        },
        c: {
          $ref: `#/x-ext/${await getHash(`${url}/external/document.json`)}`,
        },

        entry: {
          $ref: '#/a',
        },
        nonBundle: {
          $ref: `http://localhost:${PORT}/chunk1#`,
        },
        'x-ext': {
          [await getHash(`${url}/external/document.json`)]: {
            external: 'external',
            someChunk: {
              $ref: `#/x-ext/${await getHash(`${url}/external/chunk3`)}`,
              $global: true,
            },
          },
          [await getHash(`${url}/chunk1`)]: {
            chunk1: 'chunk1',
            someRef: {
              $ref: '#/b',
            },
          },
          [await getHash(`${url}/chunk2`)]: {
            chunk2: 'chunk2',
            someRef: {
              $ref: '#/c',
            },
          },
          [await getHash(`${url}/external/chunk3`)]: {
            chunk3: 'chunk3',
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/chunk1`)]: `${url}/chunk1`,
          [await getHash(`${url}/chunk2`)]: `${url}/chunk2`,
          [await getHash(`${url}/external/chunk3`)]: `${url}/external/chunk3`,
          [await getHash(`${url}/external/document.json`)]: `${url}/external/document.json`,
        },
      })
    })

    it('run success hook', async () => {
      const url = `http://localhost:${PORT}`

      const chunk1 = {
        description: 'Chunk 1',
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#`,
        },
      }

      const resolveStart = vi.fn()
      const resolveError = vi.fn()
      const resolveSuccess = vi.fn()

      const refA = input.a

      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        hooks: {
          onResolveStart(value) {
            resolveStart(value)
          },
          onResolveError(value) {
            resolveError(value)
          },
          onResolveSuccess(value) {
            resolveSuccess(value)
          },
        },
      })

      expect(resolveStart).toHaveBeenCalledOnce()
      expect(resolveStart).toHaveBeenCalledWith(refA)
      expect(resolveSuccess).toHaveBeenCalledOnce()
      expect(resolveSuccess).toHaveBeenCalledWith(refA)
      expect(resolveError).not.toHaveBeenCalledOnce()
    })

    it('run success hook', async () => {
      const url = `http://localhost:${PORT}`

      server.get('/chunk1', (_, reply) => {
        reply.code(404).send()
      })

      await server.listen({ port: PORT })

      const input = {
        a: {
          $ref: `${url}/chunk1#`,
        },
      }

      const resolveStart = vi.fn()
      const resolveError = vi.fn()
      const resolveSuccess = vi.fn()

      const refA = input.a

      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        hooks: {
          onResolveStart(value) {
            resolveStart(value)
          },
          onResolveError(value) {
            resolveError(value)
          },
          onResolveSuccess(value) {
            resolveSuccess(value)
          },
        },
      })

      expect(resolveStart).toHaveBeenCalledOnce()
      expect(resolveStart).toHaveBeenCalledWith(refA)
      expect(resolveSuccess).not.toHaveBeenCalledOnce()
      expect(resolveError).toHaveBeenCalledOnce()
      expect(resolveError).toHaveBeenCalledWith(refA)
    })
  })

  describe('local files', () => {
    it('resolves from local files', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      await fs.writeFile(chunk1Path, JSON.stringify(chunk1))

      const input = {
        a: {
          '$ref': `./${chunk1Path}#/a`,
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      await fs.rm(chunk1Path)

      expect(input).toEqual({
        'x-ext': {
          [await getHash(chunk1Path)]: {
            ...chunk1,
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(chunk1Path)}/a`,
        },
      })
    })

    it('resolves external refs from resolved files', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      const chunk2 = { a: { '$ref': `./${chunk1Path}#` } }
      const chunk2Path = randomUUID()

      await fs.writeFile(chunk1Path, JSON.stringify(chunk1))
      await fs.writeFile(chunk2Path, JSON.stringify(chunk2))

      const input = {
        a: {
          '$ref': `./${chunk2Path}#`,
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      await fs.rm(chunk1Path)
      await fs.rm(chunk2Path)

      expect(input).toEqual({
        'x-ext': {
          [await getHash(chunk1Path)]: {
            ...chunk1,
          },
          [await getHash(chunk2Path)]: {
            a: { $ref: `#/x-ext/${await getHash(chunk1Path)}` },
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(chunk2Path)}`,
        },
      })
    })

    it('resolves nested refs correctly', async () => {
      const c = {
        c: 'c',
      }
      const cName = randomUUID()

      const b = {
        b: {
          '$ref': `./${cName}`,
        },
      }
      const bName = randomUUID()

      await fs.mkdir('./nested')
      await fs.writeFile(`./nested/${bName}`, JSON.stringify(b))
      await fs.writeFile(`./nested/${cName}`, JSON.stringify(c))

      const input = {
        a: {
          '$ref': `./nested/${bName}`,
        },
      }

      await bundle(input, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      await fs.rm(`./nested/${bName}`)
      await fs.rm(`./nested/${cName}`)
      await fs.rmdir('nested')

      expect(input).toEqual({
        'x-ext': {
          [await getHash(`nested/${cName}`)]: {
            c: 'c',
          },
          [await getHash(`nested/${bName}`)]: {
            b: { $ref: `#/x-ext/${await getHash(`nested/${cName}`)}` },
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(`nested/${bName}`)}`,
        },
      })
    })

    it('bundles from a file input', async () => {
      const c = {
        c: 'c',
      }
      const cName = randomUUID()

      const b = {
        b: {
          '$ref': `./${cName}`,
        },
      }
      const bName = randomUUID()

      await fs.mkdir('./nested')
      await fs.writeFile(`./nested/${bName}`, JSON.stringify(b))
      await fs.writeFile(`./nested/${cName}`, JSON.stringify(c))

      const input = {
        a: {
          '$ref': `./${bName}`,
        },
      }
      const inputName = randomUUID()
      await fs.writeFile(`./nested/${inputName}`, JSON.stringify(input))

      const result = await bundle(`./nested/${bName}`, { plugins: [fetchUrls(), readFiles()], treeShake: false })

      await fs.rm(`./nested/${bName}`)
      await fs.rm(`./nested/${cName}`)
      await fs.rm(`./nested/${inputName}`)
      await fs.rmdir('nested')

      expect(result).toEqual({
        'b': {
          '$ref': `#/x-ext/${await getHash(`nested/${cName}`)}`,
        },
        'x-ext': {
          [await getHash(`nested/${cName}`)]: {
            'c': 'c',
          },
        },
      })
    })
  })

  describe('json inputs', () => {
    it('should process json inputs', async () => {
      const result = await bundle('{ "openapi": "3.1", "info": { "title": "Simple API", "version": "1.0" } }', {
        treeShake: false,
        plugins: [parseJson()],
      })

      expect(result).toEqual({
        openapi: '3.1',
        info: {
          title: 'Simple API',
          version: '1.0',
        },
      })
    })

    it('should correctly resolve refs for json inputs', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      await fs.writeFile(chunk1Path, JSON.stringify(chunk1))

      const input = JSON.stringify({
        a: {
          '$ref': `./${chunk1Path}#/a`,
        },
      })

      const result = await bundle(input, { plugins: [readFiles(), parseJson()], treeShake: false })

      await fs.rm(chunk1Path)

      expect(result).toEqual({
        'x-ext': {
          [await getHash(chunk1Path)]: {
            ...chunk1,
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(chunk1Path)}/a`,
        },
      })
    })
  })

  describe('yaml inputs', () => {
    it('should process yaml inputs', async () => {
      const result = await bundle('openapi: "3.1"\ninfo:\n  title: Simple API\n  version: "1.0"\n', {
        treeShake: false,
        plugins: [parseYaml()],
      })

      expect(result).toEqual({
        openapi: '3.1',
        info: {
          title: 'Simple API',
          version: '1.0',
        },
      })
    })

    it('should correctly resolve refs for yaml inputs', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      await fs.writeFile(chunk1Path, YAML.stringify(chunk1))

      const input = YAML.stringify({
        a: {
          '$ref': `./${chunk1Path}#/a`,
        },
      })

      const result = await bundle(input, { plugins: [parseYaml(), readFiles()], treeShake: false })

      await fs.rm(chunk1Path)

      expect(result).toEqual({
        'x-ext': {
          [await getHash(chunk1Path)]: {
            ...chunk1,
          },
        },
        a: {
          $ref: `#/x-ext/${await getHash(chunk1Path)}/a`,
        },
      })
    })
  })
})

describe('isRemoteUrl', () => {
  it.each([
    ['https://example.com/schema.json', true],
    ['http://api.example.com/schemas/user.json', true],
    ['file://some/path', false],
    ['random-string', false],
    ['#/components/schemas/User', false],
    ['./local-schema.json', false],
  ])('detects remote urls', (a, b) => {
    expect(isRemoteUrl(a)).toBe(b)
  })
})

describe('isLocalRef', () => {
  it.each([
    ['#/components/schemas/User', true],
    ['https://example.com/schema.json', false],
    ['./local-schema.json', false],
  ])('detects local refs', (a, b) => {
    expect(isLocalRef(a)).toBe(b)
  })
})

describe('getNestedValue', () => {
  it.each([
    [{ a: { b: { c: 'hello' } } }, ['a', 'b', 'c'], 'hello'],
    [{ a: { b: { c: 'hello' } } }, [], { a: { b: { c: 'hello' } } }],
    [{ foo: { bar: { baz: 42 } } }, ['foo', 'bar', 'baz'], 42],
    [{ foo: { bar: { baz: 42 } } }, ['foo', 'non-existing', 'baz'], undefined],
  ])('gets nested value', (a, b, c) => {
    expect(getNestedValue(a, b)).toEqual(c)
  })
})

describe('prefixInternalRef', () => {
  it.each([
    ['#/hello', ['prefix'], '#/prefix/hello'],
    ['#/a/b/c', ['prefixA', 'prefixB'], '#/prefixA/prefixB/a/b/c'],
  ])('correctly prefix the internal refs', (a, b, c) => {
    expect(prefixInternalRef(a, b)).toEqual(c)
  })

  it('throws when the ref is not internal', () => {
    expect(() => prefixInternalRef('http://example.com#/prefix', ['a', 'b'])).toThrowError()
  })
})

describe('prefixInternalRefRecursive', () => {
  it.each([
    [
      { a: { $ref: '#/a/b' }, b: { $ref: '#' } },
      ['d', 'e', 'f'],
      { a: { $ref: '#/d/e/f/a/b' }, b: { $ref: '#/d/e/f' } },
    ],
    [
      { a: { $ref: '#/a/b' }, b: { $ref: 'http://example.com#/external' } },
      ['d', 'e', 'f'],
      { a: { $ref: '#/d/e/f/a/b' }, b: { $ref: 'http://example.com#/external' } },
    ],
  ])('recursively prefixes any internal ref with the correct values', (a, b, c) => {
    prefixInternalRefRecursive(a, b)
    expect(a).toEqual(c)
  })
})

describe('setValueAtPath', () => {
  it.each([
    [{}, '/a/b/c', { hello: 'hi' }, { a: { b: { c: { hello: 'hi' } } } }],
    [{ a: { b: 'b' } }, '/a/c', { hello: 'hi' }, { a: { b: 'b', c: { hello: 'hi' } } }],
  ])('correctly sets a value at the specified path by creating new objects if necessary', (a, b, c, d) => {
    setValueAtPath(a, b, c)

    expect(a).toEqual(d)
  })
})
