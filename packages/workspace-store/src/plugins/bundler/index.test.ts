import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { type FastifyInstance, fastify } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deepClone } from '@/helpers/general'
import {
  externalValueResolver,
  loadingStatus,
  normalizeAuthSchemes,
  normalizeRefs,
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

  describe('normalizeRefs', () => {
    it('removes extra properties from a $ref node', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  extraProperty: 'should be removed',
                  anotherExtraProperty: 'also removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('preserves summary property on a $ref node', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  summary: 'User response summary',
                  extraProperty: 'should be removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: 'User response summary',
        description: undefined,
        '$status': undefined,
      })
    })

    it('preserves description property on a $ref node', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  description: 'A detailed description',
                  extraProperty: 'should be removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: undefined,
        description: 'A detailed description',
        '$status': undefined,
      })
    })

    it('preserves $status property on a $ref node', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  '$status': 'loading',
                  extraProperty: 'should be removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: undefined,
        description: undefined,
        '$status': 'loading',
      })
    })

    it('preserves all allowed properties on a $ref node', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  summary: 'User response',
                  description: 'Detailed description',
                  '$status': 'error',
                  extraProperty: 'should be removed',
                  anotherExtra: 123,
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: 'User response',
        description: 'Detailed description',
        '$status': 'error',
      })
    })

    it('does not normalize $ref under components/schemas path', async () => {
      const input = {
        components: {
          schemas: {
            User: {
              $ref: '#/components/schemas/BaseUser',
              extraProperty: 'should NOT be removed',
              anotherExtra: 'also NOT removed',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.components.schemas.User).toEqual({
        $ref: '#/components/schemas/BaseUser',
        extraProperty: 'should NOT be removed',
        anotherExtra: 'also NOT removed',
      })
    })

    it('normalizes $ref in request body', async () => {
      const input = {
        paths: {
          '/users': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/User',
                      extraProperty: 'should be removed',
                    },
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].post.requestBody.content['application/json'].schema).toEqual({
        $ref: '#/components/schemas/User',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('normalizes $ref in parameters', async () => {
      const input = {
        paths: {
          '/users/{id}': {
            get: {
              parameters: [
                {
                  $ref: '#/components/parameters/IdParameter',
                  extraProperty: 'should be removed',
                },
              ],
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users/{id}'].get.parameters[0]).toEqual({
        $ref: '#/components/parameters/IdParameter',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('normalizes multiple $ref nodes in the same document', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  extra1: 'removed',
                },
                404: {
                  $ref: '#/components/responses/NotFound',
                  extra2: 'also removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
      expect(input.paths['/users'].get.responses['404']).toEqual({
        $ref: '#/components/responses/NotFound',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('handles $ref with only allowed properties', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  summary: 'User response',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: 'User response',
        description: undefined,
        '$status': undefined,
      })
    })

    it('does not modify nodes without $ref', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        extraProperty: 'not removed',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200'].content['application/json'].schema).toEqual({
        type: 'object',
        extraProperty: 'not removed',
      })
    })

    it('normalizes $ref in headers', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  headers: {
                    'X-Rate-Limit': {
                      $ref: '#/components/headers/RateLimit',
                      extraProperty: 'should be removed',
                    },
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200'].headers['X-Rate-Limit']).toEqual({
        $ref: '#/components/headers/RateLimit',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('normalizes $ref in security schemes usage', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              security: [
                {
                  bearerAuth: {
                    $ref: '#/components/securitySchemes/bearerAuth',
                    extraProperty: 'should be removed',
                  },
                },
              ],
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.security[0]?.bearerAuth).toEqual({
        $ref: '#/components/securitySchemes/bearerAuth',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('handles deeply nested $ref normalization', async () => {
      const input = {
        paths: {
          '/users': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        {
                          $ref: '#/components/schemas/BaseUser',
                          extraProperty: 'should be removed',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].post.requestBody.content['application/json'].schema.allOf[0]).toEqual({
        $ref: '#/components/schemas/BaseUser',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })

    it('does not normalize $ref when path starts with components/schemas', async () => {
      const input = {
        components: {
          schemas: {
            UserProfile: {
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                  extraProperty: 'should NOT be removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      // The $ref should NOT be normalized because the path starts with components/schemas
      expect(input.components.schemas.UserProfile.properties.user).toEqual({
        $ref: '#/components/schemas/User',
        extraProperty: 'should NOT be removed',
      })
    })

    it('handles $ref with empty string values for allowed properties', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  summary: '',
                  description: '',
                  extraProperty: 'removed',
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: '',
        description: '',
        '$status': undefined,
      })
    })

    it('handles $ref when node has numeric and boolean extra properties', async () => {
      const input = {
        paths: {
          '/users': {
            get: {
              responses: {
                200: {
                  $ref: '#/components/responses/UserResponse',
                  numericProperty: 42,
                  booleanProperty: true,
                  objectProperty: { nested: 'value' },
                  arrayProperty: [1, 2, 3],
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [normalizeRefs()],
      })

      expect(input.paths['/users'].get.responses['200']).toEqual({
        $ref: '#/components/responses/UserResponse',
        summary: undefined,
        description: undefined,
        '$status': undefined,
      })
    })
  })
})
