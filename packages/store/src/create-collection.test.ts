import { ref } from '@vue/reactivity'
import { describe, expect, it } from 'vitest'
import { createCollection } from './create-collection.ts'

describe('create-collection', () => {
  describe('create', () => {
    it('upgrades to OpenAPI 3.1.1', () => {
      const definition = {
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

      const collection = createCollection(definition)

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

    it('allows to pass a string', () => {
      const definition = {
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        paths: {},
      }

      const collection = createCollection(JSON.stringify(definition))

      expect(collection.document).toMatchObject(definition)
    })

    it('creates a collection from a Ref<Record<string, unknown>>', () => {
      const definition = ref({
        openapi: '3.1.1',
        info: { title: 'Example', version: '1.0.0' },
        paths: {},
      })

      const collection = createCollection(definition)

      expect(collection.document).toMatchObject(definition.value)

      // keeps the collection up to date
      definition.value.info.title = 'Changed'

      // @ts-expect-error TODO: fix this
      expect(collection.document?.info?.title).toBe('Changed')
    })

    it('creates a collection from a Ref<string>', () => {
      const definition = ref(
        JSON.stringify({
          openapi: '3.1.1',
          info: { title: 'Example', version: '1.0.0' },
          paths: {},
        }),
      )

      const collection = createCollection(definition)

      expect(collection.document).toMatchObject({
        openapi: '3.1.1',
        info: { title: 'Example', version: '1.0.0' },
        paths: {},
      })

      // keeps the collection up to date
      definition.value = JSON.stringify({
        openapi: '3.1.1',
        info: { title: 'Changed', version: '1.0.0' },
        paths: {},
      })

      // @ts-expect-error TODO: fix this
      expect(collection.document?.info?.title).toBe('Changed')
    })
  })

  describe('read', () => {
    it('creates a store and resolves references on access', () => {
      const definition = {
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

      const collection = createCollection(definition)

      // Original object
      expect(collection.document.components.schemas.Person).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })

      // Resolved reference
      expect(collection.document.components.schemas.User).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
    })
  })

  describe('write', () => {
    it('updates properties through both original and reference paths', () => {
      const definition = {
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

      const collection = createCollection(definition)

      // Update via the original Person schema path
      collection.document.components.schemas.Person.properties.age = { type: 'number' }

      // Update via the User schema reference path
      collection.document.components.schemas.User.properties.gender = { type: 'string' }

      expect(collection.document.components.schemas.Person.properties).toMatchObject({
        name: { type: 'string' },
        age: { type: 'number' },
        gender: { type: 'string' },
      })

      expect(collection.document.components.schemas.User.properties).toMatchObject({
        name: { type: 'string' },
        age: { type: 'number' },
        gender: { type: 'string' },
      })
    })
  })

  describe('export', () => {
    it('updates properties through both original and reference paths', () => {
      const definition = {
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://example.com/{version}',
            variables: {
              version: {
                default: 'v1',
              },
            },
          },
          {
            url: 'https://example.com/v2',
            variables: {
              version: { default: 'v2' },
            },
          },
        ],
        paths: {},
      }

      const collection = createCollection(definition)

      collection.document.servers[0].variables.version._value = 'v3'

      expect(collection.document.servers[0].variables.version._value).toBe('v3')

      // Doesn't have _ variables when exporting
      expect(collection.export()).not.toHaveProperty('servers.0.variables.version._value')

      expect(collection.export()).toMatchObject({
        openapi: '3.1.1',
        info: {
          title: 'Example',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://example.com/{version}',
            variables: {
              version: {
                default: 'v1',
              },
            },
          },
          {
            url: 'https://example.com/v2',
            variables: {
              version: { default: 'v2' },
            },
          },
        ],
        paths: {},
      })
    })

    it('supports circular references', () => {
      const definition = {
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

      const collection = createCollection(definition)

      const result = collection.export()

      expect(result.components?.schemas?.Circular?.properties?.self).toMatchObject({
        $ref: '#/components/schemas/Circular',
      })
    })
  })
})
