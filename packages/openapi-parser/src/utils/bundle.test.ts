import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { afterEach } from 'node:test'
import fastify, { type FastifyInstance } from 'fastify'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { bundle, fetchJson, getNestedValue, isExternalRef, isLocalFileRef, isRemoteRef, readFile } from './bundle'

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
      const PORT = 7789

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
          '$ref': `http://localhost:${PORT}/#/prop`,
        },
      }

      await bundle(input)
      expect(input.d).toBe(external.prop)
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
          '$ref': `${url}/chunk2/#`,
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
              '$ref': `${url}/chunk1/#`,
            },
          },
        },
      }

      await bundle(input)
      expect(input.a.b.c).toEqual({ ...chunk1, b: chunk2 })
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
          '$ref': `${url}/#/a`,
        },
        b: {
          '$ref': `${url}/#/b`,
        },
      }

      await bundle(input)

      expect(input.a).toBe('a')
      expect(input.b).toBe('b')

      // We expect the bundler to cache the result for the same url
      expect(fn.mock.calls.length).toBe(1)
    })
  })

  describe('local files', () => {
    it('resolves from local files', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      await fs.writeFile(chunk1Path, JSON.stringify(chunk1))

      const input = {
        a: {
          '$ref': `./${chunk1Path}/#/a`,
        },
      }

      await bundle(input)

      expect(input.a).toBe('a')

      await fs.rm(chunk1Path)
    })

    it('resolves external refs from resolved files', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      const chunk2 = { a: { '$ref': `./${chunk1Path}/#` } }
      const chunk2Path = randomUUID()

      await fs.writeFile(chunk1Path, JSON.stringify(chunk1))
      await fs.writeFile(chunk2Path, JSON.stringify(chunk2))

      const input = {
        a: {
          '$ref': `./${chunk2Path}/#`,
        },
      }

      await bundle(input)
      expect(input.a).toEqual({ a: chunk1 })

      await fs.rm(chunk1Path)
      await fs.rm(chunk2Path)
    })
  })
})

describe('isRemoteRef', () => {
  it.each([
    ['https://example.com/schema.json', true],
    ['http://api.example.com/schemas/user.json', true],
    ['#/components/schemas/User', false],
    ['./local-schema.json', false],
  ])('detects remote refs', (a, b) => {
    expect(isRemoteRef(a)).toBe(b)
  })
})

describe('isLocalFileRef', () => {
  it.each([
    ['./schemas/user.json', true],
    ['../models/pet.json', true],
    ['/absolute/path/schema.json', true],
    ['#/components/schemas/User', false],
    ['https://example.com/schema.json', false],
  ])('detects local file refs', (a, b) => {
    expect(isLocalFileRef(a)).toBe(b)
  })
})

describe('isExternalRef', () => {
  it.each([
    ['https://example.com/schema.json', true],
    ['./schemas/user.json', true],
    ['../models/pet.json', true],
    ['/absolute/path/schema.json', true],
    ['#/components/schemas/User', false],
  ])('detects external refs', (a, b) => {
    expect(isExternalRef(a)).toBe(b)
  })
})

describe('fetchJson', () => {
  let server: FastifyInstance

  beforeEach(() => {
    server = fastify({ logger: false })
  })

  afterEach(async () => {
    await server.close()
  })

  it('returns json response', async () => {
    const PORT = 6677
    const url = `http://localhost:${PORT}`

    const response = {
      message: '200OK',
    }

    server.get('/', (_, reply) => {
      reply.send(response)
    })

    await server.listen({ port: PORT })

    const result = await fetchJson(url)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual(response)
  })

  it('returns error on non-200 response', async () => {
    const PORT = 6678
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.status(404).send()
    })

    await server.listen({ port: PORT })

    const result = await fetchJson(url)

    expect(result.ok).toBe(false)
  })

  it('returns error on non-json response', async () => {
    const PORT = 6680
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.header('content-type', 'text/html').send('<html>Hello World</html>')
    })

    await server.listen({ port: PORT })

    const result = await fetchJson(url)

    expect(result.ok).toBe(false)
  })
})

describe('readFile', () => {
  it('reads json contents of a file', async () => {
    const contents = { message: 'ok' }
    const path = randomUUID()
    await fs.writeFile(path, JSON.stringify(contents))

    const result = await readFile(path)

    expect(result.ok).toBe(true)
    assert(result.ok === true)

    expect(result.data).toEqual(contents)

    await fs.rm(path)
  })

  it('returns error for non-json content', async () => {
    const path = randomUUID()
    await fs.writeFile(path, '<Non JSON content>')

    const result = await readFile(path)

    expect(result.ok).toBe(false)

    await fs.rm(path)
  })

  it('returns error for non-existent file', async () => {
    const result = await readFile(randomUUID())

    expect(result.ok).toBe(false)
  })
})

describe('getNestedValue', () => {
  it.each([
    [{ a: { b: { c: 'hello' } } }, ['a', 'b', 'c'], 'hello'],
    [{ a: { b: { c: 'hello' } } }, [], { a: { b: { c: 'hello' } } }],
    [{ foo: { bar: { baz: 42 } } }, ['foo', 'bar', 'baz'], 42],
  ])('gets nested value', (a, b, c) => {
    expect(getNestedValue(a, b)).toEqual(c)
  })
})
