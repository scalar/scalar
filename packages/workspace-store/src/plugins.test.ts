import { deepClone } from '@/helpers/general'
import { externalValueResolver, loadingStatus, refsEverywhere, restoreOriginalRefs, cleanUp } from '@/plugins'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { fastify, type FastifyInstance } from 'fastify'
import { setTimeout } from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    const port = 9988
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
    const port = 9988
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
          'c766ed8': {
            'description': 'Some resolved value',
          },
        },
        'x-ext-urls': {
          'c766ed8': 'http://localhost:9988',
        },
      })
    })
  })

  describe('cleanUp', () => {
    it('adds type: object to schemas with properties but no type', async () => {
      const input = {
        components: {
          schemas: {
            User: {
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            Product: {
              properties: {
                id: { type: 'string' },
                price: { type: 'number' },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.User as any).type).toBe('object')
      expect((input.components.schemas.Product as any).type).toBe('object')
    })

    it('does not modify schemas that already have a type', async () => {
      const input = {
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            StringSchema: {
              type: 'string',
              properties: {
                minLength: { type: 'number' },
              },
            },
          },
        },
      }

      const originalInput = deepClone(input)

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect(input).toEqual(originalInput)
    })

    it('does not modify nodes without properties', async () => {
      const input = {
        components: {
          schemas: {
            SimpleString: { type: 'string' },
            SimpleNumber: { type: 'number' },
            SimpleBoolean: { type: 'boolean' },
          },
        },
      }

      const originalInput = deepClone(input)

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect(input).toEqual(originalInput)
    })

    it('handles nested schema objects', async () => {
      const input = {
        components: {
          schemas: {
            User: {
              properties: {
                profile: {
                  properties: {
                    avatar: { type: 'string' },
                  },
                },
                settings: {
                  properties: {
                    theme: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.User as any).type).toBe('object')
      expect((input.components.schemas.User as any).properties.profile.type).toBe('object')
      expect((input.components.schemas.User as any).properties.settings.type).toBe('object')
    })

    it('handles array items with properties', async () => {
      const input = {
        components: {
          schemas: {
            UserList: {
              type: 'array',
              items: {
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.UserList.items as any).type).toBe('object')
    })

    it('handles allOf, anyOf, oneOf schemas', async () => {
      const input = {
        components: {
          schemas: {
            CombinedUser: {
              allOf: [
                {
                  properties: {
                    base: { type: 'string' },
                  },
                },
                {
                  properties: {
                    extended: { type: 'string' },
                  },
                },
              ],
            },
            AlternativeUser: {
              anyOf: [
                {
                  properties: {
                    option1: { type: 'string' },
                  },
                },
                {
                  properties: {
                    option2: { type: 'string' },
                  },
                },
              ],
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.CombinedUser.allOf[0] as any).type).toBe('object')
      expect((input.components.schemas.CombinedUser.allOf[1] as any).type).toBe('object')
      expect((input.components.schemas.AlternativeUser.anyOf[0] as any).type).toBe('object')
      expect((input.components.schemas.AlternativeUser.anyOf[1] as any).type).toBe('object')
    })

    it('handles requestBody and responses', async () => {
      const input = {
        paths: {
          '/users': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        properties: {
                          id: { type: 'string' },
                          success: { type: 'boolean' },
                        },
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
        plugins: [cleanUp()],
      })

      expect((input.paths['/users'].post.requestBody?.content['application/json'].schema as any).type).toBe('object')
      expect((input.paths['/users'].post.responses['200']?.content['application/json'].schema as any).type).toBe(
        'object',
      )
    })

    it('preserves existing properties when adding type', async () => {
      const input = {
        components: {
          schemas: {
            User: {
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
              required: ['name', 'email'],
              description: 'A user in the system',
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.User as any).type).toBe('object')
      expect(input.components.schemas.User.properties).toEqual({
        name: { type: 'string' },
        email: { type: 'string' },
      })
      expect(input.components.schemas.User.required).toEqual(['name', 'email'])
      expect(input.components.schemas.User.description).toBe('A user in the system')
    })

    it('handles empty properties object', async () => {
      const input = {
        components: {
          schemas: {
            EmptySchema: {
              properties: {},
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.EmptySchema as any).type).toBe('object')
      expect(input.components.schemas.EmptySchema.properties).toEqual({})
    })

    it('does not modify non-schema nodes', async () => {
      const input = {
        info: {
          title: 'API',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production server',
          },
        ],
        paths: {
          '/health': {
            get: {
              summary: 'Health check',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const originalInput = deepClone(input)

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect(input).toEqual(originalInput)
    })

    it('adds type: array to schemas with array-related keywords', async () => {
      const input = {
        components: {
          schemas: {
            StringArray: {
              items: { type: 'string' },
            },
            NumberArray: {
              prefixItems: [{ type: 'number' }, { type: 'string' }],
            },
            ConstrainedArray: {
              minItems: 1,
              maxItems: 10,
              items: { type: 'boolean' },
            },
            UniqueArray: {
              uniqueItems: true,
              items: { type: 'string' },
            },
            MixedArray: {
              items: { type: 'string' },
              minItems: 0,
              maxItems: 100,
              uniqueItems: false,
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.StringArray as any).type).toBe('array')
      expect((input.components.schemas.NumberArray as any).type).toBe('array')
      expect((input.components.schemas.ConstrainedArray as any).type).toBe('array')
      expect((input.components.schemas.UniqueArray as any).type).toBe('array')
      expect((input.components.schemas.MixedArray as any).type).toBe('array')
    })

    it('handles schemas with both properties and array keywords', async () => {
      const input = {
        components: {
          schemas: {
            ComplexSchema: {
              properties: {
                name: { type: 'string' },
              },
              items: { type: 'string' },
              minItems: 1,
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      // Should prioritize object type when both properties and array keywords exist
      expect((input.components.schemas.ComplexSchema as any).type).toBe('object')
    })

    it('handles deeply nested array schemas', async () => {
      const input = {
        components: {
          schemas: {
            NestedArray: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  properties: {
                    value: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      // Should add type: object to the nested schema with properties
      expect((input.components.schemas.NestedArray.items.items as any).type).toBe('object')
    })

    it('handles schemas with only one array keyword', async () => {
      const input = {
        components: {
          schemas: {
            OnlyItems: {
              items: { type: 'string' },
            },
            OnlyMinItems: {
              minItems: 0,
            },
            OnlyMaxItems: {
              maxItems: 10,
            },
            OnlyUniqueItems: {
              uniqueItems: true,
            },
            OnlyPrefixItems: {
              prefixItems: [{ type: 'number' }],
            },
          },
        },
      }

      await bundle(input, {
        treeShake: false,
        plugins: [cleanUp()],
      })

      expect((input.components.schemas.OnlyItems as any).type).toBe('array')
      expect((input.components.schemas.OnlyMinItems as any).type).toBe('array')
      expect((input.components.schemas.OnlyMaxItems as any).type).toBe('array')
      expect((input.components.schemas.OnlyUniqueItems as any).type).toBe('array')
      expect((input.components.schemas.OnlyPrefixItems as any).type).toBe('array')
    })
  })
})
