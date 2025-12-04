import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockServer } from './create-mock-server'
import { store } from './libs/store'

describe('x-seed', () => {
  beforeEach(() => {
    // Clear store before each test to ensure clean state
    store.clear()
  })

  describe('basic seeding', () => {
    it('seeds data using seed.count()', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Article: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
              },
              'x-seed': `
                seed.count(3, () => ({
                  id: faker.string.uuid(),
                  title: faker.lorem.sentence(),
                  content: faker.lorem.paragraph()
                }))
              `,
            },
          },
        },
        paths: {
          '/articles': {
            get: {
              'x-handler': "return store.list('Article');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      // Verify data was seeded
      const response = await server.request('/articles')
      expect(response.status).toBe(200)
      const articles = await response.json()
      expect(articles).toHaveLength(3)
      expect(articles[0]).toHaveProperty('id')
      expect(articles[0]).toHaveProperty('title')
      expect(articles[0]).toHaveProperty('content')
    })

    it('seeds data using seed(array)', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
              'x-seed': `
                seed([
                  { id: '1', name: 'John Doe', email: 'john@example.com' },
                  { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
                ])
              `,
            },
          },
        },
        paths: {
          '/users': {
            get: {
              'x-handler': "return store.list('User');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/users')
      expect(response.status).toBe(200)
      const users = await response.json()
      expect(users).toHaveLength(2)
      expect(users[0].name).toBe('John Doe')
      expect(users[1].name).toBe('Jane Smith')
    })

    it('seeds data using seed(factory) for single item', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Comment: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
              'x-seed': `
                seed(() => ({
                  id: faker.string.uuid(),
                  text: faker.lorem.sentence()
                }))
              `,
            },
          },
        },
        paths: {
          '/comments': {
            get: {
              'x-handler': "return store.list('Comment');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/comments')
      expect(response.status).toBe(200)
      const comments = await response.json()
      expect(comments).toHaveLength(1)
      expect(comments[0]).toHaveProperty('id')
      expect(comments[0]).toHaveProperty('text')
    })
  })

  describe('idempotent seeding', () => {
    it('only seeds when collection is empty', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Article: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
              'x-seed': `
                seed.count(3, () => ({
                  id: faker.string.uuid(),
                  title: faker.lorem.sentence()
                }))
              `,
            },
          },
        },
        paths: {
          '/articles': {
            get: {
              'x-handler': "return store.list('Article');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      // Pre-populate the collection
      store.create('Article', { id: 'existing-1', title: 'Existing Article' })

      const server = await createMockServer({ document })

      // Verify that seeding did not run (collection was not empty)
      const response = await server.request('/articles')
      expect(response.status).toBe(200)
      const articles = await response.json()
      expect(articles).toHaveLength(1)
      expect(articles[0].id).toBe('existing-1')
    })

    it('seeds when collection is empty', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Article: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
              'x-seed': `
                seed.count(2, () => ({
                  id: faker.string.uuid(),
                  title: faker.lorem.sentence()
                }))
              `,
            },
          },
        },
        paths: {
          '/articles': {
            get: {
              'x-handler': "return store.list('Article');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      // Ensure collection is empty
      store.clear('Article')

      const server = await createMockServer({ document })

      // Verify that seeding ran
      const response = await server.request('/articles')
      expect(response.status).toBe(200)
      const articles = await response.json()
      expect(articles).toHaveLength(2)
    })
  })

  describe('multiple schemas with x-seed', () => {
    it('seeds multiple collections', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Article: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
              'x-seed': `
                seed.count(2, () => ({
                  id: faker.string.uuid(),
                  title: faker.lorem.sentence()
                }))
              `,
            },
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
              'x-seed': `
                seed.count(2, () => ({
                  id: faker.string.uuid(),
                  name: faker.person.fullName()
                }))
              `,
            },
          },
        },
        paths: {
          '/articles': {
            get: {
              'x-handler': "return store.list('Article');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
          '/users': {
            get: {
              'x-handler': "return store.list('User');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      // Verify both collections were seeded
      const articlesResponse = await server.request('/articles')
      expect(articlesResponse.status).toBe(200)
      const articles = await articlesResponse.json()
      expect(articles).toHaveLength(2)

      const usersResponse = await server.request('/users')
      expect(usersResponse.status).toBe(200)
      const users = await usersResponse.json()
      expect(users).toHaveLength(2)
    })
  })

  describe('error handling', () => {
    it('handles errors in seed code gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Article: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
              'x-seed': 'throw new Error("Seed error");',
            },
          },
        },
        paths: {
          '/articles': {
            get: {
              'x-handler': "return store.list('Article');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      // Server should still start even if seeding fails
      const server = await createMockServer({ document })

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('Error seeding schema "Article"')

      // Verify collection is empty (seeding failed)
      const response = await server.request('/articles')
      expect(response.status).toBe(200)
      const articles = await response.json()
      expect(articles).toHaveLength(0)

      consoleErrorSpy.mockRestore()
    })

    it('handles invalid seed() usage', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Article: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
              'x-seed': 'seed("invalid");',
            },
          },
        },
        paths: {
          '/articles': {
            get: {
              'x-handler': "return store.list('Article');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Verify collection is empty (seeding failed)
      const response = await server.request('/articles')
      expect(response.status).toBe(200)
      const articles = await response.json()
      expect(articles).toHaveLength(0)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('schema key usage', () => {
    it('handles camelCase schema names', async () => {
      const document = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          schemas: {
            UserProfile: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
              'x-seed': `
                seed.count(1, () => ({
                  id: faker.string.uuid(),
                  name: faker.person.fullName()
                }))
              `,
            },
          },
        },
        paths: {
          '/userProfiles': {
            get: {
              'x-handler': "return store.list('UserProfile');",
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      const response = await server.request('/userProfiles')
      expect(response.status).toBe(200)
      const profiles = await response.json()
      expect(profiles).toHaveLength(1)
    })
  })
})
