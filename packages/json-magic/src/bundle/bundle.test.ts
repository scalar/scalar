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
  type LoaderPlugin,
} from './bundle'
import { fetchUrls } from './plugins/fetch-urls'
import { readFiles } from './plugins/read-files'
import { setTimeout } from 'node:timers/promises'
import { parseJson } from '@/bundle/plugins/parse-json'
import { parseYaml } from '@/bundle/plugins/parse-yaml'
import YAML from 'yaml'
import { getHash } from '@/bundle/value-generator'
import { consoleWarnSpy, resetConsoleSpies } from '@scalar/helpers/testing/console-spies'

describe('bundle', () => {
  describe('external urls', () => {
    let server: FastifyInstance
    const port = 7289
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('bundles external urls', async () => {
      const url = `http://localhost:${port}`

      const external = {
        prop: 'I am external json prop',
      }
      server.get('/', (_, reply) => {
        reply.send(external)
      })

      await server.listen({ port: port })

      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          '$ref': `http://localhost:${port}#/prop`,
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
      const url = `http://localhost:${port}`
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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

      server.get('/', (_, reply) => {
        reply.send({
          a: 'a',
        })
      })

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

      server.get('/', (_, reply) => {
        fn()
        reply.send({
          a: 'a',
          b: 'b',
        })
      })

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

      const chunk1 = {
        a: {
          hello: 'hello',
        },
      }
      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: port })

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
      const url = `http://localhost:${port}`

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

      await server.listen({ port: port })

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
          $ref: `http://localhost:${port}/chunk1#`,
        },
        'x-ext': {
          [await getHash(`${url}/external/document.json`)]: {
            external: 'external',
            someChunk: {
              $ref: `#/x-ext/${await getHash(`${url}/chunk3`)}`,
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
          [await getHash(`${url}/chunk3`)]: {
            chunk3: 'chunk3',
          },
        },
        'x-ext-urls': {
          [await getHash(`${url}/chunk1`)]: `${url}/chunk1`,
          [await getHash(`${url}/chunk2`)]: `${url}/chunk2`,
          [await getHash(`${url}/chunk3`)]: `${url}/chunk3`,
          [await getHash(`${url}/external/document.json`)]: `${url}/external/document.json`,
        },
      })
    })

    it('run success hook', async () => {
      const url = `http://localhost:${port}`

      const chunk1 = {
        description: 'Chunk 1',
      }

      server.get('/chunk1', (_, reply) => {
        reply.send(chunk1)
      })

      await server.listen({ port: port })

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

    it('run error hook', async () => {
      const url = `http://localhost:${port}`

      server.get('/chunk1', (_, reply) => {
        reply.code(404).send()
      })

      await server.listen({ port: port })

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

    it('uses the provided origin for object inputs', async () => {
      server.get('/', () => ({
        message: 'some resolved external reference',
      }))
      await server.listen({ port })

      const result = await bundle(
        {
          a: {
            $ref: '/#',
          },
        },
        {
          treeShake: false,
          plugins: [fetchUrls()],
          origin: url,
        },
      )

      expect(result).toEqual({
        'a': {
          '$ref': '#/x-ext/3664f29',
        },
        'x-ext': {
          '3664f29': {
            'message': 'some resolved external reference',
          },
        },
      })
    })

    it('prioritizes configuration origin rather than document input url', async () => {
      server.get('/', () => ({
        a: {
          $ref: '/d#',
        },
      }))
      server.get('/d', () => ({
        message: 'some resolved external reference',
      }))
      await server.listen({ port: port })

      const result = await bundle(url, {
        plugins: [fetchUrls()],
        treeShake: false,
        origin: `${url}/a/b/c`,
      })

      expect(result).toEqual({
        a: { '$ref': '#/x-ext/e53b62c' },
        'x-ext': { e53b62c: { message: 'some resolved external reference' } },
      })
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
    let server: FastifyInstance
    const port = 7229
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

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

    it('should correctly load the document from an url even when yaml plugin is provided and it has high priority on the list', async () => {
      server.get('/', () => ({
        openapi: '3.1.1',
        info: {
          title: 'My API',
        },
      }))
      await server.listen({ port })
      const result = await bundle(url, {
        treeShake: false,
        plugins: [parseYaml(), fetchUrls()],
      })

      expect(result).toEqual({
        'info': {
          'title': 'My API',
        },
        'openapi': '3.1.1',
      })
    })
  })

  describe('bundle with a certain depth', () => {
    let server: FastifyInstance
    const PORT = 7299
    const url = `http://localhost:${PORT}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('bundles external urls', async () => {
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
            c: {
              d: {
                e: {
                  // Deep ref
                  '$ref': `http://localhost:${PORT}#/prop`,
                },
              },
            },
          },
        },
        d: {
          e: {
            '$ref': `http://localhost:${PORT}#/prop`,
          },
        },
      }

      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        depth: 2,
      })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            ...external,
          },
        },
        'x-ext-urls': {
          [await getHash(url)]: url,
        },
        a: {
          b: {
            c: {
              d: {
                e: {
                  $ref: `${url}#/prop`,
                },
              },
            },
          },
        },
        d: {
          e: {
            $ref: `#/x-ext/${await getHash(url)}/prop`,
          },
        },
      })
    })

    it('will not do full bundle if we do specify a depth and reuse the same hash set', async () => {
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
            c: {
              d: {
                e: {
                  // Deep ref
                  '$ref': `http://localhost:${PORT}#/prop`,
                },
              },
            },
          },
        },
        d: {
          e: {
            '$ref': `http://localhost:${PORT}#/prop`,
          },
        },
      }

      const visitedNodes = new Set()

      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        depth: 2,
        visitedNodes: visitedNodes,
      })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            ...external,
          },
        },
        'x-ext-urls': {
          [await getHash(url)]: url,
        },
        a: {
          b: {
            c: {
              d: {
                e: {
                  $ref: `${url}#/prop`,
                },
              },
            },
          },
        },
        d: {
          e: {
            $ref: `#/x-ext/${await getHash(url)}/prop`,
          },
        },
      })

      // We run a full bundle on the root of the document without a depth
      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        visitedNodes: visitedNodes,
        urlMap: true,
      })

      // Expect the input to be the same as before
      // because we are reusing the same hash set
      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            ...external,
          },
        },
        'x-ext-urls': {
          [await getHash(url)]: url,
        },
        a: {
          b: {
            c: {
              d: {
                e: {
                  $ref: `${url}#/prop`,
                },
              },
            },
          },
        },
        d: {
          e: {
            $ref: `#/x-ext/${await getHash(url)}/prop`,
          },
        },
      })

      // When we run a full bundle again without the same hash set we expect a full bundle
      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        urlMap: true,
      })

      expect(input).toEqual({
        'x-ext': {
          [await getHash(url)]: {
            ...external,
          },
        },
        'x-ext-urls': {
          [await getHash(url)]: url,
        },
        a: {
          b: {
            c: {
              d: {
                e: {
                  $ref: `#/x-ext/${await getHash(url)}/prop`,
                },
              },
            },
          },
        },
        d: {
          e: {
            $ref: `#/x-ext/${await getHash(url)}/prop`,
          },
        },
      })
    })
  })

  describe('hooks', () => {
    describe('onBeforeNodeProcess', () => {
      it('should correctly call the `onBeforeNodeProcess` correctly on all the nodes', async () => {
        const fn = vi.fn()

        const input = {
          someKey: 'someValue',
          anotherKey: {
            innerKey: 'nestedValue',
          },
        }

        await bundle(input, {
          plugins: [],
          treeShake: false,
          hooks: {
            onBeforeNodeProcess(node) {
              fn(node)
            },
          },
        })

        expect(fn).toHaveBeenCalled()
        expect(fn).toBeCalledTimes(2)

        expect(fn.mock.calls[0][0]).toEqual(input)
        expect(fn.mock.calls[1][0]).toEqual(input.anotherKey)
      })

      it('should run bundle on the mutated object properties', async () => {
        const fn = vi.fn()

        const input = {
          a: {
            b: {
              c: 'c',
              d: 'd',
            },
            e: 'e',
          },
        }

        await bundle(input, {
          plugins: [],
          treeShake: false,
          hooks: {
            onBeforeNodeProcess(node) {
              if ('e' in node) {
                node['processedKey'] = { 'message': 'Processed node' }
              }
              fn(node)
            },
          },
        })

        expect(fn).toHaveBeenCalled()
        expect(fn).toBeCalledTimes(4)

        expect(fn.mock.calls[3][0]).toEqual({ 'message': 'Processed node' })
      })
    })

    describe('onAfterNodeProcess', () => {
      it('should call `onAfterNodeProcess` hook on the nodes', async () => {
        const fn = vi.fn()

        const input = {
          a: {
            b: {
              c: 'c',
              d: 'd',
            },
            e: 'e',
          },
        }

        await bundle(input, {
          plugins: [],
          treeShake: false,
          hooks: {
            onAfterNodeProcess(node) {
              if ('e' in node) {
                node['processedKey'] = { 'message': 'Processed node' }
              }
              fn(node)
            },
          },
        })

        expect(fn).toHaveBeenCalled()
        expect(fn).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('plugins', () => {
    it('use load plugins to load the documents', async () => {
      const validate = vi.fn()
      const exec = vi.fn()

      const resolver = (): LoaderPlugin => {
        return {
          type: 'loader',
          validate(value) {
            validate(value)
            return true
          },
          async exec(value) {
            exec(value)
            return {
              ok: true,
              data: { message: 'Resolved document' },
            }
          },
        }
      }

      const result = await bundle('hello', { treeShake: false, plugins: [resolver()] })

      expect(validate).toHaveBeenCalledOnce()
      expect(exec).toHaveBeenCalledOnce()

      expect(validate.mock.calls[0][0]).toBe('hello')
      expect(exec.mock.calls[0][0]).toBe('hello')

      expect(result).toEqual({ message: 'Resolved document' })
    })

    it('throws if we can not process the input with any of the provided loaders', async () => {
      const validate = vi.fn()
      const exec = vi.fn()

      const resolver = (): LoaderPlugin => {
        return {
          type: 'loader',
          validate(value) {
            validate(value)
            return false
          },
          async exec(value) {
            exec(value)
            return {
              ok: true,
              data: { message: 'Resolved document' },
            }
          },
        }
      }

      await expect(bundle('hello', { treeShake: false, plugins: [resolver()] })).rejects.toThrow()

      expect(validate).toHaveBeenCalledOnce()
      expect(validate.mock.calls[0][0]).toBe('hello')

      expect(exec).not.toHaveBeenCalled()
    })

    it('use load plugin to resolve external refs', async () => {
      const validate = vi.fn()
      const exec = vi.fn()

      const resolver = (): LoaderPlugin => {
        return {
          type: 'loader',
          validate(value) {
            validate(value)
            return true
          },
          async exec(value) {
            exec(value)
            return {
              ok: true,
              data: { message: 'Resolved document' },
            }
          },
        }
      }

      const result = await bundle({ $ref: 'hello' }, { treeShake: false, plugins: [resolver()] })

      expect(validate).toHaveBeenCalledOnce()
      expect(exec).toHaveBeenCalledOnce()

      expect(validate.mock.calls[0][0]).toBe('hello')
      expect(exec.mock.calls[0][0]).toBe('hello')

      expect(result).toEqual({
        $ref: '#/x-ext/aaf4c61',
        'x-ext': {
          'aaf4c61': {
            message: 'Resolved document',
          },
        },
      })
    })

    it('emits warning when there is no loader to resolve the external ref', async () => {
      resetConsoleSpies()
      const validate = vi.fn()
      const exec = vi.fn()

      const resolver = (): LoaderPlugin => {
        return {
          type: 'loader',
          validate(value) {
            validate(value)
            return false
          },
          async exec(value) {
            exec(value)
            return {
              ok: true,
              data: { message: 'Resolved document' },
            }
          },
        }
      }

      const result = await bundle({ $ref: 'hello' }, { treeShake: false, plugins: [resolver()] })

      expect(validate).toHaveBeenCalledOnce()
      expect(validate.mock.calls[0][0]).toBe('hello')

      expect(exec).not.toHaveBeenCalled()

      expect(result).toEqual({ $ref: 'hello' })

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to resolve external reference "hello". The reference may be invalid, inaccessible, or missing a loader for this type of reference.',
      )
    })

    it('lets plugins hook into nodes lifecycle #1', async () => {
      const onBeforeNodeProcessCallback = vi.fn()
      const onAfterNodeProcessCallback = vi.fn()

      await bundle(
        {
          prop: {
            innerProp: 'string',
          },
        },
        {
          treeShake: false,
          plugins: [
            {
              type: 'lifecycle',
              onBeforeNodeProcess: onBeforeNodeProcessCallback,
              onAfterNodeProcess: onAfterNodeProcessCallback,
            },
          ],
        },
      )

      expect(onBeforeNodeProcessCallback).toHaveBeenCalledTimes(2)
      expect(onBeforeNodeProcessCallback.mock.calls[0][0]).toEqual({
        prop: {
          innerProp: 'string',
        },
      })
      expect(onBeforeNodeProcessCallback.mock.calls[0][1]).toEqual({
        path: [],
        resolutionCache: new Map(),
        parentNode: null,
        rootNode: {
          prop: {
            innerProp: 'string',
          },
        },
        loaders: [],
      })
      expect(onBeforeNodeProcessCallback.mock.calls[1][0]).toEqual({
        innerProp: 'string',
      })
      expect(onBeforeNodeProcessCallback.mock.calls[1][1]).toEqual({
        path: ['prop'],
        resolutionCache: new Map(),
        parentNode: {
          prop: {
            innerProp: 'string',
          },
        },
        rootNode: {
          prop: {
            innerProp: 'string',
          },
        },
        loaders: [],
      })
      expect(onAfterNodeProcessCallback).toHaveBeenCalledTimes(2)
      expect(onAfterNodeProcessCallback.mock.calls[0][0]).toEqual({
        innerProp: 'string',
      })
      expect(onAfterNodeProcessCallback.mock.calls[0][1]).toEqual({
        path: ['prop'],
        resolutionCache: new Map(),
        parentNode: {
          prop: {
            innerProp: 'string',
          },
        },
        rootNode: {
          prop: {
            innerProp: 'string',
          },
        },
        loaders: [],
      })
      expect(onAfterNodeProcessCallback.mock.calls[1][0]).toEqual({
        prop: {
          innerProp: 'string',
        },
      })
      expect(onAfterNodeProcessCallback.mock.calls[1][1]).toEqual({
        path: [],
        resolutionCache: new Map(),
        parentNode: null,
        rootNode: {
          prop: {
            innerProp: 'string',
          },
        },
        loaders: [],
      })
    })

    it('lets plugins hook into nodes lifecycle #2', async () => {
      const validate = vi.fn()
      const exec = vi.fn()
      const onResolveStart = vi.fn()
      const onResolveError = vi.fn()
      const onResolveSuccess = vi.fn()
      await bundle(
        {
          hello: {
            $ref: 'some-value',
          },
          hi: {
            $ref: 'resolve',
          },
        },
        {
          treeShake: false,
          plugins: [
            {
              type: 'loader',
              validate(value) {
                validate()
                if (value === 'resolve') {
                  return true
                }
                return false
              },
              async exec(value) {
                exec()
                return {
                  ok: true,
                  data: {
                    message: 'Resolved value',
                    'x-original-value': value,
                  },
                }
              },
            },
            {
              type: 'lifecycle',
              onResolveStart,
              onResolveError,
              onResolveSuccess,
            },
          ],
        },
      )

      expect(validate).toHaveBeenCalledTimes(2)
      expect(exec).toHaveBeenCalledOnce()

      expect(onResolveStart).toHaveBeenCalledTimes(2)
      expect(onResolveStart.mock.calls[0][0]).toEqual({
        $ref: 'some-value',
      })
      expect(onResolveStart.mock.calls[1][0]).toEqual({
        $ref: '#/x-ext/4e7a208',
      })
      expect(onResolveError).toHaveBeenCalledTimes(1)
      expect(onResolveError.mock.calls[0][0]).toEqual({
        $ref: 'some-value',
      })
      expect(onResolveSuccess).toHaveBeenCalledTimes(1)
      expect(onResolveSuccess.mock.calls[0][0]).toEqual({
        $ref: '#/x-ext/4e7a208',
      })
    })

    it('correctly provides the parent node in different levels', async () => {
      const onBeforeNodeProcess = vi.fn()
      const input = {
        a: {
          b: {
            c: {
              someNode: 'hello world',
            },
          },
        },
        d: {
          $ref: '#/a',
        },
        e: {
          f: {
            $ref: '#/a/b/c',
          },
        },
      }

      await bundle(input, {
        plugins: [
          {
            type: 'lifecycle',
            onBeforeNodeProcess,
          },
        ],
        treeShake: false,
      })

      expect(onBeforeNodeProcess).toHaveBeenCalled()

      // First call should be the root with a null parent
      expect(onBeforeNodeProcess.mock.calls[0][0]).toEqual(input)
      expect(onBeforeNodeProcess.mock.calls[0][1].parentNode).toEqual(null)

      expect(onBeforeNodeProcess.mock.calls[1][0]).toEqual(input.a)
      expect(onBeforeNodeProcess.mock.calls[1][1].parentNode).toEqual(input)

      expect(onBeforeNodeProcess.mock.calls[2][0]).toEqual(input.d)
      expect(onBeforeNodeProcess.mock.calls[2][1].parentNode).toEqual(input)

      expect(onBeforeNodeProcess.mock.calls[3][0]).toEqual(input.e)
      expect(onBeforeNodeProcess.mock.calls[3][1].parentNode).toEqual(input)

      expect(onBeforeNodeProcess.mock.calls[4][0]).toEqual(input.a.b)
      expect(onBeforeNodeProcess.mock.calls[4][1].parentNode).toEqual(input.a)

      expect(onBeforeNodeProcess.mock.calls[5][0]).toEqual(input.e.f)
      expect(onBeforeNodeProcess.mock.calls[5][1].parentNode).toEqual(input.e)

      expect(onBeforeNodeProcess.mock.calls[6][0]).toEqual(input.a.b.c)
      expect(onBeforeNodeProcess.mock.calls[6][1].parentNode).toEqual(input.a.b)
    })

    it('correctly provides the parent node on partial bundle for referenced nodes', async () => {
      const onBeforeNodeProcess = vi.fn()

      const input = {
        a: {
          b: 'some-prop',
        },
        b: {
          c: {
            $ref: '#/a',
          },
        },
      }

      await bundle(input.b, {
        treeShake: false,
        root: input,
        plugins: [
          {
            type: 'lifecycle',
            onBeforeNodeProcess,
          },
        ],
      })

      expect(onBeforeNodeProcess).toHaveBeenCalled()
      expect(onBeforeNodeProcess.mock.calls[0][0]).toEqual(input.b)
      expect(onBeforeNodeProcess.mock.calls[0][1].parentNode).toEqual(null)

      expect(onBeforeNodeProcess.mock.calls[1][0]).toEqual(input.b.c)
      expect(onBeforeNodeProcess.mock.calls[1][1].parentNode).toEqual(input.b)

      expect(onBeforeNodeProcess.mock.calls[2][0]).toEqual(input.a)
      expect(onBeforeNodeProcess.mock.calls[2][1].parentNode).toEqual(input)
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
