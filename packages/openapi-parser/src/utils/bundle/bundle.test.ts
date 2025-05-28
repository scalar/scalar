import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import fastify, { type FastifyInstance } from 'fastify'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bundle,
  getNestedValue,
  isLocalRef,
  isRemoteUrl,
  prefixInternalRef,
  prefixInternalRefRecursive,
} from './bundle'
import { fetchUrls } from './plugins/fetch-urls'
import { readFiles } from './plugins/read-files'

describe('bundle', () => {
  describe('external urls', () => {
    let server: FastifyInstance

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterAll(async () => {
      await server.close()
    })

    it('bundles external urls', async () => {
      const PORT = 6738

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
      })

      expect(input).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}`]: {
            ...external,
          },
        },
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: `#/x-external-references/http:~1~1localhost:${PORT}/prop`,
        },
      })
    })

    it('bundles external urls from resolved external piece', async () => {
      const PORT = 8890
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      expect(input).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}~1chunk1`]: {
            ...chunk1,
            b: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1chunk2`,
            },
          },
          [`http:~1~1localhost:${PORT}~1chunk2`]: {
            ...chunk2,
            internal: '#/nested/key',
          },
        },
        a: {
          b: {
            c: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1chunk1`,
            },
          },
        },
      })
    })

    it('should correctly handle only urls without a pointer', async () => {
      const PORT = 5678
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      expect(input).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}`]: {
            a: 'a',
          },
        },
        a: {
          b: {
            $ref: `#/x-external-references/http:~1~1localhost:${PORT}`,
          },
        },
      })
    })

    it('caches results for same resource', async () => {
      const fn = vi.fn()
      const PORT = 4402
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      expect(input).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}`]: {
            a: 'a',
            b: 'b',
          },
        },
        a: {
          $ref: `#/x-external-references/http:~1~1localhost:${PORT}/a`,
        },
        b: {
          $ref: `#/x-external-references/http:~1~1localhost:${PORT}/b`,
        },
      })

      // We expect the bundler to cache the result for the same url
      expect(fn.mock.calls.length).toBe(1)
    })

    it('handles correctly external nested refs', async () => {
      const PORT = 5578
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      expect(input).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}~1nested~1another-file.json`]: {
            c: 'c',
          },
          [`http:~1~1localhost:${PORT}~1nested~1chunk1.json`]: {
            b: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1nested~1another-file.json`,
            },
          },
        },
        a: {
          $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1nested~1chunk1.json`,
        },
      })
    })

    it('does not merge paths when we use absolute urls', async () => {
      const PORT = 5579
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      expect(input).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}~1top-level`]: {
            c: 'c',
          },
          [`http:~1~1localhost:${PORT}~1nested~1chunk1.json`]: {
            b: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1top-level`,
            },
          },
        },
        a: {
          $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1nested~1chunk1.json`,
        },
      })
    })

    it('bundles from a url input', async () => {
      const PORT = 5588
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

      const output = await bundle(`${url}/base/openapi.json`, { plugins: [fetchUrls()] })

      expect(output).toEqual({
        'x-external-references': {
          [`http:~1~1localhost:${PORT}~1top-level`]: {
            c: 'c',
          },
          [`http:~1~1localhost:${PORT}~1nested~1chunk1.json`]: {
            b: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1top-level`,
            },
          },
        },
        a: {
          $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1nested~1chunk1.json`,
        },
      })
    })

    it('prefixes the refs only once', async () => {
      const PORT = 8896
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

      await bundle(input, { plugins: [fetchUrls()] })

      expect(input).toEqual({
        a: {
          b: {
            c: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1chunk1`,
            },
            d: {
              e: {
                f: {
                  g: {
                    $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1chunk1`,
                  },
                },
              },
            },
          },
        },
        'x-external-references': {
          'http:~1~1localhost:8896~1chunk1': {
            a: {
              hello: 'hello',
            },
            b: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1chunk2`,
            },
          },
          'http:~1~1localhost:8896~1chunk2': {
            a: 'a',
            b: {
              $ref: `#/x-external-references/http:~1~1localhost:${PORT}~1chunk1`,
            },
          },
        },
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      await fs.rm(chunk1Path)

      expect(input).toEqual({
        'x-external-references': {
          [`${chunk1Path}`]: {
            ...chunk1,
          },
        },
        a: {
          $ref: `#/x-external-references/${chunk1Path}/a`,
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      await fs.rm(chunk1Path)
      await fs.rm(chunk2Path)

      expect(input).toEqual({
        'x-external-references': {
          [`${chunk1Path}`]: {
            ...chunk1,
          },
          [`${chunk2Path}`]: {
            a: { $ref: `#/x-external-references/${chunk1Path}` },
          },
        },
        a: {
          $ref: `#/x-external-references/${chunk2Path}`,
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

      await bundle(input, { plugins: [fetchUrls(), readFiles()] })

      await fs.rm(`./nested/${bName}`)
      await fs.rm(`./nested/${cName}`)
      await fs.rmdir('nested')

      expect(input).toEqual({
        'x-external-references': {
          [`nested~1${cName}`]: {
            c: 'c',
          },
          [`nested~1${bName}`]: {
            b: { $ref: `#/x-external-references/nested~1${cName}` },
          },
        },
        a: {
          $ref: `#/x-external-references/nested~1${bName}`,
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

      const result = await bundle(`./nested/${bName}`, { plugins: [fetchUrls(), readFiles()] })

      await fs.rm(`./nested/${bName}`)
      await fs.rm(`./nested/${cName}`)
      await fs.rm(`./nested/${inputName}`)
      await fs.rmdir('nested')

      expect(result).toEqual({
        'b': {
          '$ref': `#/x-external-references/nested~1${cName}`,
        },
        'x-external-references': {
          [`nested~1${cName}`]: {
            'c': 'c',
          },
        },
      })
    })
  })
})

describe('isRemoteUrl', () => {
  it.each([
    ['https://example.com/schema.json', true],
    ['http://api.example.com/schemas/user.json', true],
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
