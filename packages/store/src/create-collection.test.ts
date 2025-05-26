import type { AnyObject } from '@scalar/openapi-parser'
import { describe, expect, it, vi } from 'vitest'
import { createCollection } from './create-collection'

describe('create-collection', () => {
  describe('create', () => {
    it('upgrades to OpenAPI 3.1.1', async () => {
      const EXAMPLE_DOCUMENT = {
        swagger: '2.0',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        host: 'localhost:8000',
        basePath: '/api',
        schemes: ['http'],
        paths: {},
        definitions: {},
      }

      const collection = await createCollection({ content: EXAMPLE_DOCUMENT })

      expect(collection.document).toStrictEqual({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:8000/api',
          },
        ],
        paths: {},
        components: {
          schemas: {},
        },
      })
    })

    it(`throws if it's not an OpenAPI document`, async () => {
      await expect(createCollection({ content: {} })).rejects.toThrow(
        'Invalid OpenAPI/Swagger document, failed to find a specification version.',
      )
    })

    it('allows to pass a string', async () => {
      const EXAMPLE_DOCUMENT = {
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        paths: {},
      }

      const collection = await createCollection({ content: JSON.stringify(EXAMPLE_DOCUMENT) })

      expect(collection.document).toMatchObject(EXAMPLE_DOCUMENT)
    })
  })

  describe('read', () => {
    it('creates a store and resolves references on access', async () => {
      const EXAMPLE_DOCUMENT = {
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            User: {
              $ref: '#/components/schemas/Person',
            },
          },
        },
      }

      const collection = await createCollection({ content: EXAMPLE_DOCUMENT })

      // Original object
      expect((collection.document as AnyObject).components?.schemas?.Person).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })

      // Resolved reference
      expect((collection.document as AnyObject).components?.schemas?.User).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
    })

    it('resolves references inside arrays with anyOf', async () => {
      const EXAMPLE_DOCUMENT = {
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            Dog: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                breed: { type: 'string' },
              },
            },
            Cat: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                lives: { type: 'number' },
              },
            },
            Person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                pets: {
                  type: 'array',
                  items: {
                    anyOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
                  },
                },
              },
            },
          },
        },
      }

      const collection = await createCollection({ content: EXAMPLE_DOCUMENT })

      // Check that both references in anyOf are resolved
      expect(
        (collection.document as AnyObject).components?.schemas?.Person?.properties?.pets?.items?.anyOf,
      ).toMatchObject([
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            breed: { type: 'string' },
          },
        },
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            lives: { type: 'number' },
          },
        },
      ])
    })
  })

  describe('read-only', () => {
    it('warns when trying to update the document', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn')
      const collection = await createCollection({ content: { openapi: '3.1.1' } })

      // @ts-expect-error We expect a TS error here, we're testing that it's read-only.
      collection.document.openapi = '3.1.2'

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Vue warn] Set operation on key "openapi" failed: target is readonly.',
        { openapi: '3.1.1' },
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('external references', () => {
    it('fetches references in references', async () => {
      // Mock fetch to return a static OpenAPI document with external references
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'https://example.com/foobar/openapi.yaml') {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  openapi: '3.1.1',
                  info: {
                    title: 'Test API',
                    version: '1.0.0',
                  },
                  paths: {
                    '/test': {
                      get: {
                        $ref: 'components.yaml#/components/schemas/Test',
                      },
                    },
                  },
                }),
              ),
          })
        }

        if (url === 'https://example.com/foobar/components.yaml') {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  components: {
                    schemas: {
                      Test: {
                        $ref: '../barfoo.yaml#/components/schemas/Test',
                      },
                    },
                  },
                }),
              ),
          })
        }

        if (url === 'https://example.com/barfoo.yaml') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ components: { schemas: { Test: { type: 'object' } } } })),
          })
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })

      const collection = await createCollection({
        url: 'https://example.com/foobar/openapi.yaml',
      })

      const { externalReferences } = collection

      expect(externalReferences.getReference('https://example.com/foobar/openapi.yaml')?.status).toBe('fetched')
      expect(externalReferences.getReference('https://example.com/foobar/components.yaml')?.status).toBe('fetched')
      expect(externalReferences.getReference('https://example.com/barfoo.yaml')?.status).toBe('fetched')
    })

    it('fetches the description', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'https://example.com/openapi.yaml') {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  openapi: '3.1.1',
                  info: {
                    title: 'Test API',
                    version: '1.0.0',
                    description: {
                      $ref: 'description.yml#/introduction',
                    },
                  },
                  paths: {},
                }),
              ),
          })
        }

        if (url === 'https://example.com/description.yml') {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  introduction: 'This is a test description',
                }),
              ),
          })
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })

      const collection = await createCollection({
        url: 'https://example.com/openapi.yaml',
      })

      expect(collection.document.info).toMatchObject({
        description: 'This is a test description',
      })

      expect((collection.document as AnyObject).info?.description).toBe('This is a test description')
    })
  })

  describe('export', () => {
    it('supports circular references', async () => {
      const EXAMPLE_DOCUMENT = {
        openapi: '3.1.1',
        info: { title: 'Example', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Circular: {
              type: 'object',
              properties: {
                self: { $ref: '#/components/schemas/Circular' },
              },
            },
          },
        },
      }

      const collection = await createCollection({ content: EXAMPLE_DOCUMENT })

      const result = collection.export()

      expect((result as AnyObject).components?.schemas?.Circular?.properties?.self).toMatchObject({
        $ref: '#/components/schemas/Circular',
      })
    })
  })
})
