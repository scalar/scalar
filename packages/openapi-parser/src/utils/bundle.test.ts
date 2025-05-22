import { afterAll, beforeEach, describe, expect, test } from 'vitest'
import fastify, { type FastifyInstance } from 'fastify'
import { bundle, fetchJson, getNestedValue, isExternalRef, isLocalFileRef, isRemoteRef, readFile } from './bundle'
import { afterEach } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

describe.skip('bundle', () => {
  describe('external urls', () => {
    let server: FastifyInstance

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterAll(async () => {
      await server.close()
    })

    test('should bundle external urls', async () => {
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

    test('should bundle external urls from the resolved external piece', async () => {
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
  })
})

describe('isRemoteRef', () => {
  test.each([
    ['https://example.com/schema.json', true],
    ['http://api.example.com/schemas/user.json', true],
    ['#/components/schemas/User', false],
    ['./local-schema.json', false],
  ])('should correctly detect remote refs', (a, b) => {
    expect(isRemoteRef(a)).toBe(b)
  })
})

describe('isLocalFileRef', () => {
  test.each([
    ['./schemas/user.json', true],
    ['../models/pet.json', true],
    ['/absolute/path/schema.json', true],
    ['#/components/schemas/User', false],
    ['https://example.com/schema.json', false],
  ])('should correctly detect remote refs', (a, b) => {
    expect(isLocalFileRef(a)).toBe(b)
  })
})

describe('isExternalRef', () => {
  test.each([
    ['https://example.com/schema.json', true],
    ['./schemas/user.json', true],
    ['../models/pet.json', true],
    ['/absolute/path/schema.json', true],
    ['#/components/schemas/User', false],
  ])('should correctly detect remote refs', (a, b) => {
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

  test('should correctly return json response', async () => {
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

  test('should return ok false on error response code', async () => {
    const PORT = 6678
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.status(404).send()
    })

    await server.listen({ port: PORT })

    const result = await fetchJson(url)

    expect(result.ok).toBe(false)
  })

  test('should return ok false on non json response', async () => {
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
  test('should read json contents of a file', async () => {
    const contents = { message: 'ok' }
    const path = randomUUID()
    await fs.writeFile(path, JSON.stringify(contents))

    const result = await readFile(path)

    expect(result.ok).toBe(true)
    assert(result.ok === true)

    expect(result.data).toEqual(contents)

    await fs.rm(path)
  })

  test('should return ok false when file does not contain JSON data', async () => {
    const path = randomUUID()
    await fs.writeFile(path, '<Non JSON content>')

    const result = await readFile(path)

    expect(result.ok).toBe(false)

    await fs.rm(path)
  })

  test('should return ok false when file does not exists', async () => {
    const result = await readFile(randomUUID())

    expect(result.ok).toBe(false)
  })
})

describe('getNestedValue', () => {
  test.each([
    [{ a: { b: { c: 'hello' } } }, ['a', 'b', 'c'], 'hello'],
    [{ a: { b: { c: 'hello' } } }, [], { a: { b: { c: 'hello' } } }],
    [{ foo: { bar: { baz: 42 } } }, ['foo', 'bar', 'baz'], 42],
  ])('should correctly get a nested value', (a, b, c) => {
    expect(getNestedValue(a, b)).toEqual(c)
  })
})
