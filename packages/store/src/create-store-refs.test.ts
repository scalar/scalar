import { describe, expect, it } from 'vitest'
import { createStore } from './create-store-refs.ts'

describe('create-store-refs', () => {
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

      const store = createStore(definition)

      // Original object
      expect(store.document.components.schemas.Person).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })

      // Resolved reference
      expect(store.document.components.schemas.User).toMatchObject({
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

      const store = createStore(definition)

      // Update via the original Person schema path
      store.document.components.schemas.Person.properties.age = { type: 'number' }

      // Update via the User schema reference path
      store.document.components.schemas.User.properties.gender = { type: 'string' }

      expect(store.document.components.schemas.Person.properties).toMatchObject({
        name: { type: 'string' },
        age: { type: 'number' },
        gender: { type: 'string' },
      })

      expect(store.document.components.schemas.User.properties).toMatchObject({
        name: { type: 'string' },
        age: { type: 'number' },
        gender: { type: 'string' },
      })
    })
  })

  describe('values', () => {
    it('returns the value of a reference', () => {
      const definition = {
        openapi: '3.1.1',
      }
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

      const store = createStore(definition)

      store.document.servers[0].variables.version._value = 'v3'

      expect(store.document.servers[0].variables.version._value).toBe('v3')

      // Doesn’t have _ variables when exporting
      expect(store.export()).not.toHaveProperty('servers.0.variables.version._value')
    })
  })
})
