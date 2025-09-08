import { setTimeout } from 'node:timers/promises'

import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { type FastifyInstance, fastify } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { deepClone } from '@/helpers/general'
import { externalValueResolver, loadingStatus, refsEverywhere, restoreOriginalRefs } from '@/plugins'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('plugins', () => {
  describe('loadingStatus', () => {
    it('sets the loading status to the correct value during ref resolution', async () => {
      const onResolveStart = vi.fn()
      const onResolveError = vi.fn()
      const onResolveSuccess = vi.fn()

      const resolveStarted = deferred<null>()
      const resolveSucceeded = deferred<null>()

      const input = {
        a: {
          b: 'hello',
        },
        c: {
          $ref: 'some-ref',
        },
      } as any

      bundle(input, {
        plugins: [
          {
            type: 'loader',
            validate: (value: string) => value === 'some-ref',
            exec: async () => {
              return {
                ok: true,
                data: { resolved: true },
              }
            },
          },
          {
            type: 'lifecycle',
            onResolveStart: (...args) => {
              onResolveStart(args)
              resolveStarted.resolve(null)
            },
            onResolveError,
            onResolveSuccess: (...args) => {
              onResolveSuccess(args)
              resolveSucceeded.resolve(null)
            },
          },
          loadingStatus(),
        ],
        treeShake: false,
      })

      await resolveStarted.promise

      // Verify that the loading status was set during resolution
      expect(onResolveStart).toHaveBeenCalled()
      expect(input.c['$status']).toBe('loading')

      await resolveSucceeded.promise

      // Verify that the loading status was set during resolution
      expect(onResolveSuccess).toHaveBeenCalled()
      expect(input.c['$status']).toBeUndefined() // Should be removed after successful resolution
    })

    it('sets error status when ref resolution fails', async () => {
      const input = {
        c: {
          $ref: 'invalid-ref',
        },
      } as any

      const resolveErrored = deferred<null>()

      bundle(input, {
        plugins: [
          {
            type: 'loader',
            validate: (value: string) => value === 'invalid-ref',
            exec: async () => {
              return {
                ok: false,
                error: 'Failed to resolve reference',
              }
            },
          },
          {
            type: 'lifecycle',
            onResolveError: () => {
              resolveErrored.resolve(null)
            },
          },
          loadingStatus(),
        ],
        treeShake: false,
      })

      await resolveErrored.promise

      // Verify that the error status was set
      expect(input.c.$status).toBe('error')
    })
  })

  describe('externalValueResolver', () => {
    let server: FastifyInstance
    const port = 9809
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('resolves external values', async () => {
      server.get('/', () => {
        return { a: 'a' }
      })

      await server.listen({ port })

      const input = {
        hello: 'world',
        a: {
          externalValue: url,
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [externalValueResolver(), fetchUrls()],
      })

      expect(input).toEqual({
        hello: 'world',
        a: {
          externalValue: url,
          value: { a: 'a' },
        },
      })
    })
  })

  describe('refsEverywhere', () => {
    let server: FastifyInstance
    const port = 9181
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('inline refs on the info object', async () => {
      server.get('/', () => {
        return {
          description: 'Some description',
        }
      })
      await server.listen({ port })

      const input = {
        info: {
          $ref: url,
        },
      }

      const result = await bundle(input, {
        treeShake: false,
        plugins: [refsEverywhere(), fetchUrls()],
      })

      expect(result).toEqual({
        info: {
          description: 'Some description',
        },
      })
    })

    it('does not inline refs if the info object is not top level', async () => {
      server.get('/', () => {
        return {
          description: 'Some description',
        }
      })
      await server.listen({ port })

      const input = {
        someProp: {
          info: {
            $ref: url,
          },
        },
      }

      const result = await bundle(input, {
        treeShake: false,
        plugins: [fetchUrls(), refsEverywhere()],
      })

      expect(result).toEqual({
        someProp: {
          info: {
            '$ref': '#/x-ext/9002c86',
          },
        },
        'x-ext': {
          '9002c86': {
            description: 'Some description',
          },
        },
      })
    })
  })

  describe('restoreOriginalRefs', async () => {
    let server: FastifyInstance
    const port = 9088
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('restores the original references', { timeout: 100000 }, async () => {
      server.get('/', () => ({ description: 'Some resolved value' }))
      await server.listen({ port })

      const originalInput = {
        a: 'a',
        b: {
          $ref: url,
        },
      }

      const input = deepClone(originalInput)

      await bundle(input, {
        plugins: [fetchUrls()],
        treeShake: false,
        urlMap: true,
      })

      await bundle(input, {
        treeShake: false,
        urlMap: true,
        plugins: [restoreOriginalRefs()],
      })

      expect(input).toEqual({
        ...originalInput,
        'x-ext': {
          '261215d': {
            'description': 'Some resolved value',
          },
        },
        'x-ext-urls': {
          '261215d': 'http://localhost:9088',
        },
      })
    })
  })
})
