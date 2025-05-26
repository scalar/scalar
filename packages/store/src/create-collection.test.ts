import type { AnyObject } from '@scalar/openapi-parser'
import { describe, expect, it, vi } from 'vitest'
import { createCollection, getValueByPath, hasRefs, isObject, parseJsonPointer } from './create-collection'

describe('createCollection', () => {
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

describe('proxy behavior', () => {
  it('caches proxy instances', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/BaseUser' },
          BaseUser: { type: 'object' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User
    const userSchema2 = collection.document.components?.schemas?.User

    // The same proxy instance should be returned
    expect(userSchema).toBe(userSchema2)
  })

  it('handles Symbol keys', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { [Symbol.for('type')]: 'object' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema[Symbol.for('type')]).toBe('object')
  })

  it('preserves property descriptors', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: Object.defineProperty({}, 'type', {
            value: 'object',
            enumerable: false,
          }),
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User
    const descriptor = Object.getOwnPropertyDescriptor(userSchema, 'type')

    expect(descriptor?.enumerable).toBe(false)
  })

  it('handles ownKeys for objects with $refs', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/BaseUser' },
          BaseUser: { type: 'object', name: 'string' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User
    const keys = Object.keys(userSchema)

    expect(keys).toContain('type')
    expect(keys).toContain('name')
  })

  it('handles has for nested properties', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/BaseUser' },
          BaseUser: { type: 'object', name: 'string' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect('type' in userSchema).toBe(true)
    expect('name' in userSchema).toBe(true)
    expect('nonexistent' in userSchema).toBe(false)
  })

  it('handles non-string/symbol keys', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { [123]: 'number key' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema[123]).toBe('number key')
  })

  it('handles getOwnPropertyDescriptor for non-$ref properties', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'object', name: 'string' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User
    const descriptor = Object.getOwnPropertyDescriptor(userSchema, 'name')

    expect(descriptor?.value).toBe('string')
    expect(descriptor?.enumerable).toBe(true)
    expect(descriptor?.configurable).toBe(true)
  })

  it('handles deeply nested references', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          Level1: { $ref: '#/components/schemas/Level2' },
          Level2: { $ref: '#/components/schemas/Level3' },
          Level3: { $ref: '#/components/schemas/Level4' },
          Level4: { type: 'object', name: 'string' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const level1 = collection.document.components?.schemas?.Level1

    expect(level1.name).toBe('string')
  })
})

describe('reference resolution', () => {
  it('handles circular references in the same document', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          Parent: {
            type: 'object',
            properties: {
              child: { $ref: '#/components/schemas/Child' },
            },
          },
          Child: {
            type: 'object',
            properties: {
              parent: { $ref: '#/components/schemas/Parent' },
            },
          },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })

    const parentSchema = collection.document.components?.schemas?.Parent
    const childSchema = collection.document.components?.schemas?.Child

    expect(parentSchema?.properties.child).toBe(childSchema)
    expect(childSchema?.properties.parent).toBe(parentSchema)
  })

  it('handles invalid JSON pointer syntax', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#invalid/pointer' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema).toEqual({ $ref: '#invalid/pointer' })
  })

  it('handles non-existent paths', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/NonExistent' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema).toEqual({ $ref: '#/components/schemas/NonExistent' })
  })

  it('handles special characters in paths', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          'User/Name': { type: 'string' },
          User: { $ref: '#/components/schemas/User~1Name' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema).toEqual({ type: 'string' })
  })

  it('handles empty paths', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema).toEqual(collection.document)
  })

  it('handles malformed $ref values', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: 123 as any },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema).toEqual({ $ref: 123 })
  })

  it('handles empty $ref values', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema).toEqual({ $ref: '' })
  })
})

describe('document structure', () => {
  it('handles OpenAPI 3.0.x documents', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.0.0',
      info: { title: 'Example', version: '1.0.0' },
      paths: {},
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.openapi).toBe('3.1.1')
  })

  it('handles documents with no paths', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.paths).toBeUndefined()
  })

  it('handles documents with no components', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      paths: {},
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components).toBeUndefined()
  })

  it('handles documents with empty objects', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {},
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components?.schemas).toEqual({})
  })

  it('handles documents with null values', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: null,
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components?.schemas?.User).toBeNull()
  })

  it('handles documents with boolean values', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'object', required: true },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components?.schemas?.User.required).toBe(true)
  })

  it('handles documents with number values', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'object', minLength: 1 },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components?.schemas?.User.minLength).toBe(1)
  })

  it('handles undefined values in documents', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'object', optional: undefined },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components?.schemas?.User.optional).toBeUndefined()
  })

  it('handles nested empty objects', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {},
            additionalProperties: {},
          },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const userSchema = collection.document.components?.schemas?.User

    expect(userSchema?.properties).toEqual({})
    expect(userSchema?.additionalProperties).toEqual({})
  })

  it('handles documents with invalid component types', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'invalid-type' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    expect(collection.document.components?.schemas?.User.type).toBe('invalid-type')
  })
})

describe('export functionality', () => {
  it('preserves circular references in arrays', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          Users: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
          User: {
            type: 'object',
            properties: {
              friends: { $ref: '#/components/schemas/Users' },
            },
          },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const exported = collection.export()

    expect((exported as any).components.schemas.Users.items.$ref).toBe('#/components/schemas/User')
    expect((exported as any).components.schemas.User.properties.friends.$ref).toBe('#/components/schemas/Users')
  })

  it('preserves special characters in keys', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          'User/Name': { type: 'string' },
        },
      },
    }

    const collection = await createCollection({ content: EXAMPLE_DOCUMENT })
    const exported = collection.export()

    expect((exported as any).components.schemas['User/Name']).toEqual({ type: 'string' })
  })
})

describe('error handling', () => {
  it('throws on invalid JSON in string content', async () => {
    await expect(createCollection({ content: '{invalid json' })).rejects.toThrow()
  })

  it('throws on missing specification version', async () => {
    await expect(createCollection({ content: {} })).rejects.toThrow(
      'Invalid OpenAPI/Swagger document, failed to find a specification version.',
    )
  })

  it('throws on invalid specification version type', async () => {
    await expect(createCollection({ content: { openapi: 123 } })).rejects.toThrow(
      'Invalid OpenAPI/Swagger document, failed to find a specification version.',
    )
  })
})

describe('utility functions', () => {
  describe('getValueByPath', () => {
    it('retrieves nested values from an object', () => {
      const document = {
        components: {
          schemas: {
            User: { type: 'object' },
          },
        },
      }

      expect(getValueByPath(document, ['components', 'schemas', 'User'])).toMatchObject({ type: 'object' })
    })

    it('returns undefined for non-existent paths', () => {
      const document = { components: {} }
      expect(getValueByPath(document, ['components', 'schemas', 'User'])).toBeUndefined()
    })

    it('handles empty path segments', () => {
      const document = { components: {} }
      expect(getValueByPath(document, [])).toBe(document)
    })

    it('handles non-string path segments', () => {
      const document = {
        components: {
          schemas: {
            User: { type: 'object' },
          },
        },
      }

      // @ts-expect-error Testing invalid input
      expect(getValueByPath(document, [123, 'schemas', 'User'])).toBeUndefined()
    })

    it('handles null/undefined path segments', () => {
      const document = {
        components: {
          schemas: {
            User: { type: 'object' },
          },
        },
      }

      // @ts-expect-error Testing invalid input
      expect(getValueByPath(document, [null, 'schemas', 'User'])).toBeUndefined()
      // @ts-expect-error Testing invalid input
      expect(getValueByPath(document, [undefined, 'schemas', 'User'])).toBeUndefined()
    })
  })

  describe('parseJsonPointer', () => {
    it('parses simple JSON pointers', () => {
      expect(parseJsonPointer('#/components/schemas/User')).toEqual(['components', 'schemas', 'User'])
    })

    it('handles escaped characters', () => {
      expect(parseJsonPointer('#/components/schemas/User~1Name')).toEqual(['components', 'schemas', 'User/Name'])
      expect(parseJsonPointer('#/components/schemas/User~0Name')).toEqual(['components', 'schemas', 'User~Name'])
    })

    it('handles empty pointers', () => {
      expect(parseJsonPointer('#')).toEqual([])
      expect(parseJsonPointer('')).toEqual([])
    })

    it('handles pointers without leading #', () => {
      expect(parseJsonPointer('components/schemas/User')).toEqual(['components', 'schemas', 'User'])
    })

    it('handles invalid escape sequences', () => {
      expect(parseJsonPointer('#/components/schemas/User~2Name')).toEqual(['components', 'schemas', 'User~2Name'])
    })

    it('handles URL-encoded characters', () => {
      expect(parseJsonPointer('#/components/schemas/User%20Name')).toEqual(['components', 'schemas', 'User Name'])
    })
  })

  describe('isObject', () => {
    it('returns true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
    })

    it('returns false for arrays', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
    })

    it('returns false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('returns false for primitives', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(undefined)).toBe(false)
    })
  })

  describe('hasRefs', () => {
    it('detects direct $ref properties', () => {
      expect(hasRefs({ $ref: '#/components/schemas/User' })).toBe(true)
    })

    it('detects nested $ref properties', () => {
      expect(
        hasRefs({
          components: {
            schemas: {
              User: { $ref: '#/components/schemas/BaseUser' },
            },
          },
        }),
      ).toBe(true)
    })

    it('detects $ref in arrays', () => {
      expect(hasRefs([{ $ref: '#/components/schemas/User' }])).toBe(true)
    })

    it('returns false for objects without $ref', () => {
      expect(hasRefs({})).toBe(false)
      expect(hasRefs({ key: 'value' })).toBe(false)
      expect(hasRefs([])).toBe(false)
      expect(hasRefs([1, 2, 3])).toBe(false)
    })

    it('handles null/undefined values in arrays', () => {
      expect(hasRefs([null, undefined, { $ref: '#/components/schemas/User' }])).toBe(true)
      expect(hasRefs([null, undefined, { type: 'object' }])).toBe(false)
    })
  })
})

describe('strategy options', () => {
  it('handles lazy loading strategy', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/BaseUser' },
          BaseUser: { type: 'object' },
        },
      },
    }

    const collection = await createCollection({
      content: EXAMPLE_DOCUMENT,
      strategy: 'lazy',
    })

    // The reference should still be resolved when accessed
    expect(collection.document.components?.schemas?.User.type).toBe('object')
  })

  it('behaves the same for both strategies with internal references', async () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: { title: 'Example', version: '1.0.0' },
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/BaseUser' },
          BaseUser: { type: 'object' },
        },
      },
    }

    const eagerCollection = await createCollection({
      content: EXAMPLE_DOCUMENT,
      strategy: 'eager',
    })

    const lazyCollection = await createCollection({
      content: EXAMPLE_DOCUMENT,
      strategy: 'lazy',
    })

    expect(eagerCollection.document.components?.schemas?.User).toEqual(
      lazyCollection.document.components?.schemas?.User,
    )
  })
})
