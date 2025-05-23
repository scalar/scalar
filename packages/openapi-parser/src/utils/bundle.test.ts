import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { afterEach } from 'node:test'
import fastify, { type FastifyInstance } from 'fastify'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { bundle, fetchUrl, getNestedValue, isLocalRef, isRemoteUrl, readFile } from './bundle'

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
          '$ref': `http://localhost:${PORT}#/prop`,
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

      await bundle(input)
      expect(input.a.b.c).toEqual({ ...chunk1, b: chunk2 })
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

      await bundle(input)
      expect(input.a.b).toEqual({ a: 'a' })
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

      await bundle(input)

      expect(input.a).toBe('a')
      expect(input.b).toBe('b')

      // We expect the bundler to cache the result for the same url
      expect(fn.mock.calls.length).toBe(1)
    })

    it('dereference the resolved documents before merging with the original document', async () => {
      const PORT = 5627
      const url = `http://localhost:${PORT}`
      server.get('/', (_, reply) => {
        reply.send({
          a: {
            '$ref': '#/b',
          },
          b: {
            c: 'c',
          },
        })
      })
      await server.listen({ port: PORT })

      const input = {
        a: {
          '$ref': url,
        },
      }
      await bundle(input)

      expect(input.a).toEqual({ a: { c: 'c' }, b: { c: 'c' } })
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
      await bundle(input)

      expect(input.a).toEqual({
        b: {
          c: 'c',
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

      await bundle(input)
      expect(input.a).toEqual({
        b: {
          c: 'c',
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

      await bundle(input)
      await fs.rm(chunk1Path)

      expect(input.a).toBe('a')
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

      await bundle(input)
      await fs.rm(chunk1Path)
      await fs.rm(chunk2Path)

      expect(input.a).toEqual({ a: chunk1 })
    })

    it('should correctly handle refs that points to refs', async () => {
      const chunk1 = { a: 'a', b: 'b' }
      const chunk1Path = randomUUID()

      const chunk2 = { a: { '$ref': `./${chunk1Path}#` } }
      const chunk2Path = randomUUID()

      await fs.writeFile(chunk1Path, JSON.stringify(chunk1))
      await fs.writeFile(chunk2Path, JSON.stringify(chunk2))

      const input = {
        a: {
          '$ref': `./${chunk2Path}#/a`,
        },
      }

      await bundle(input)

      await fs.rm(chunk1Path)
      await fs.rm(chunk2Path)

      expect(input.a).toEqual(chunk1)
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

      await bundle(input)

      await fs.rm(`./nested/${bName}`)
      await fs.rm(`./nested/${cName}`)
      await fs.rmdir('nested')

      expect(input.a).toEqual({ b: { c: 'c' } })
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

describe('fetchUrl', () => {
  let server: FastifyInstance

  beforeEach(() => {
    server = fastify({ logger: false })
  })

  afterEach(async () => {
    await server.close()
  })

  it('reads json response', async () => {
    const PORT = 6677
    const url = `http://localhost:${PORT}`

    const response = {
      message: '200OK',
    }

    server.get('/', (_, reply) => {
      reply.send(response)
    })

    await server.listen({ port: PORT })

    const result = await fetchUrl(url)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual(response)
  })

  it('reads yaml response', async () => {
    const PORT = 5726
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.header('content-type', 'application/yml').send('a: a')
    })

    await server.listen({ port: PORT })

    const result = await fetchUrl(url)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual({ a: 'a' })
  })

  it('returns error on non-200 response', async () => {
    const PORT = 6678
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.status(404).send()
    })

    await server.listen({ port: PORT })

    const result = await fetchUrl(url)

    expect(result.ok).toBe(false)
  })
})

describe('readFile', () => {
  it('reads json contents of a file', async () => {
    const contents = { message: 'ok' }
    const path = randomUUID()
    await fs.writeFile(path, JSON.stringify(contents))

    const result = await readFile(path)
    await fs.rm(path)

    expect(result.ok).toBe(true)
    assert(result.ok === true)

    expect(result.data).toEqual(contents)
  })

  it('reads yml contents of a file', async () => {
    const contents = 'a: a'
    const path = randomUUID()
    await fs.writeFile(path, contents)

    const result = await readFile(path)
    await fs.rm(path)

    expect(result.ok).toBe(true)
    assert(result.ok === true)

    expect(result.data).toEqual({ a: 'a' })
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
