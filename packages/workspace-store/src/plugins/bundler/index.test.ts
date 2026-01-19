import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { type FastifyInstance, fastify } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deepClone } from '@/helpers/general'
import {
  externalValueResolver,
  loadingStatus,
  normalizeAuthSchemes,
  refsEverywhere,
  restoreOriginalRefs,
} from '@/plugins/bundler'

describe('plugins', () => {
  describe('loadingStatus', () => {
    it('sets the loading status to the correct value during ref resolution', async () => {
      const createDeferred = <T>() => {
        let resolve!: (value: T) => void
        const promise = new Promise<T>((res) => (resolve = res))
        return { promise, resolve }
      }

      const started = createDeferred<void>()
      const succeeded = createDeferred<void>()

      const onResolveStart = vi.fn(() => started.resolve())
      const onResolveSuccess = vi.fn(() => succeeded.resolve())
      const onResolveError = vi.fn()

      const input = {
        a: {
          b: 'hello',
        },
        c: {
          $ref: 'some-ref',
        },
      } as any

      void bundle(input, {
        plugins: [
          {
            type: 'loader',
            validate: (value: string) => value === 'some-ref',
            exec: () =>
              Promise.resolve({
                ok: true,
                data: { resolved: true },
                raw: JSON.stringify({ message: 'Resolved document' }),
              }),
          },
          loadingStatus(),
          {
            type: 'lifecycle',
            onResolveStart,
            onResolveError,
            onResolveSuccess,
          },
        ],
        treeShake: false,
      })

      await started.promise

      // Verify that the loading status was set during resolution
      expect(onResolveStart).toHaveBeenCalled()
      expect(input.c['$status']).toBe('loading')

      await succeeded.promise

      // Verify that the loading status was set during resolution
      expect(onResolveSuccess).toHaveBeenCalled()
      expect(input.c['$status']).toBeUndefined() // Should be removed after successful resolution

      expect(onResolveError).not.toHaveBeenCalled()
    })

    it('sets error status when ref resolution fails', async () => {
      const input = {
        c: {
          $ref: 'invalid-ref',
        },
      } as any

      const onResolveError = vi.fn()

      void bundle(input, {
        plugins: [
          {
            type: 'loader',
            validate: (value: string) => value === 'invalid-ref',
            exec: () =>
              Promise.resolve({
                ok: false,
                error: 'Failed to resolve reference',
              }),
          },
          {
            type: 'lifecycle',
            onResolveError,
          },
          loadingStatus(),
        ],
        treeShake: false,
      })

      await vi.waitFor(() => expect(onResolveError).toHaveBeenCalled())

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

      return async () => {
        await server.close()
      }
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

      return async () => {
        await server.close()
      }
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
            '$ref': '#/x-ext/44fe49b',
          },
        },
        'x-ext': {
          '44fe49b': {
            description: 'Some description',
          },
        },
      })
    })
  })

  describe('restoreOriginalRefs', () => {
    let server: FastifyInstance
    const port = 9088
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })

      return async () => {
        await server.close()
      }
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
          'ad870b6': {
            'description': 'Some resolved value',
          },
        },
        'x-ext-urls': {
          'ad870b6': 'http://localhost:9088',
        },
      })
    })
  })

  describe('normalizeAuthSchemes', () => {
    it('normalizes Bearer to lowercase', async () => {
      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'Bearer',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
    })

    it('normalizes BASIC to lowercase', async () => {
      const input = {
        components: {
          securitySchemes: {
            basicAuth: {
              type: 'http',
              scheme: 'BASIC',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.basicAuth.scheme).toBe('basic')
    })

    it('normalizes Digest to lowercase', async () => {
      const input = {
        components: {
          securitySchemes: {
            digestAuth: {
              type: 'http',
              scheme: 'Digest',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.digestAuth.scheme).toBe('digest')
    })

    it('normalizes multiple security schemes', async () => {
      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'Bearer',
            },
            basicAuth: {
              type: 'http',
              scheme: 'BASIC',
            },
            digestAuth: {
              type: 'http',
              scheme: 'Digest',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
      expect(input.components.securitySchemes.basicAuth.scheme).toBe('basic')
      expect(input.components.securitySchemes.digestAuth.scheme).toBe('digest')
    })

    it('does not modify scheme that is already lowercase', async () => {
      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
    })

    it('handles security schemes without a scheme property', async () => {
      const input = {
        components: {
          securitySchemes: {
            apiKeyAuth: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.apiKeyAuth).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      })
    })

    it('handles scheme property that is not a string', async () => {
      const input = {
        components: {
          securitySchemes: {
            invalidAuth: {
              type: 'http',
              scheme: null as any,
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.invalidAuth.scheme).toBeNull()
    })

    it('does not normalize scheme outside of components.securitySchemes', async () => {
      const input = {
        someOtherPath: {
          scheme: 'Bearer',
        },
        components: {
          schemas: {
            Auth: {
              scheme: 'Bearer',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.someOtherPath.scheme).toBe('Bearer')
      expect(input.components.schemas.Auth.scheme).toBe('Bearer')
    })

    it('does not normalize scheme at wrong depth', async () => {
      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              nested: {
                scheme: 'Bearer',
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.bearerAuth.nested.scheme).toBe('Bearer')
    })

    it('handles empty securitySchemes object', async () => {
      const input = {
        components: {
          securitySchemes: {},
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes).toEqual({})
    })

    it('handles mixed case scheme values', async () => {
      const input = {
        components: {
          securitySchemes: {
            auth1: {
              type: 'http',
              scheme: 'BeArEr',
            },
            auth2: {
              type: 'http',
              scheme: 'BaSiC',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.auth1.scheme).toBe('bearer')
      expect(input.components.securitySchemes.auth2.scheme).toBe('basic')
    })

    it('normalizes scheme with other security scheme properties', async () => {
      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'Bearer',
              bearerFormat: 'JWT',
              description: 'JWT Bearer authentication',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      expect(input.components.securitySchemes.bearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer authentication',
      })
    })

    it('normalizes scheme when using internal $ref', async () => {
      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              $ref: '#/x-auth-definitions/bearerDefinition',
            },
          },
        },
        'x-auth-definitions': {
          bearerDefinition: {
            type: 'http',
            scheme: 'Bearer',
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeAuthSchemes()],
      })

      // The referenced definition should have its scheme normalized
      expect(input['x-auth-definitions'].bearerDefinition.scheme).toBe('bearer')
    })

    it('normalizes scheme when using external $ref', async () => {
      const server = fastify({ logger: false })
      const port = 9810
      const url = `http://localhost:${port}`

      server.get('/auth-definition', () => ({
        type: 'http',
        scheme: 'Bearer',
      }))

      await server.listen({ port })

      const input = {
        components: {
          securitySchemes: {
            bearerAuth: {
              $ref: `${url}/auth-definition`,
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [fetchUrls(), normalizeAuthSchemes()],
      })

      // The externally resolved definition should have its scheme normalized
      expect(input).toEqual({
        'components': {
          'securitySchemes': {
            'bearerAuth': {
              '$ref': '#/x-ext/c2e0c6a',
            },
          },
        },
        'x-ext': {
          'c2e0c6a': {
            'scheme': 'bearer',
            'type': 'http',
          },
        },
      })

      await server.close()
    })
  })
})
