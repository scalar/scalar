import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockServer } from './create-mock-server'
import { store } from './libs/store'

describe('x-handle', () => {
  beforeEach(() => {
    // Clear store before each test to ensure clean state
    store.clear()
  })

  it('handler with store.list() returns array', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          get: {
            'x-handle': "return store.list('items');",
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

    const response = await server.request('/items')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('handler with store.create() creates and returns item', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': "return store.create('items', req.body);",
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data.name).toBe('Test Item')
  })

  it('handler with store.get() retrieves item', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': "return store.create('items', req.body);",
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
          get: {
            'x-handle': "return store.get('items', req.params.id);",
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
        '/items/{id}': {
          get: {
            'x-handle': "return store.get('items', req.params.id);",
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

    // Create an item
    const createResponse = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    })

    const created = await createResponse.json()
    const itemId = created.id

    // Get the item
    const getResponse = await server.request(`/items/${itemId}`)

    expect(getResponse.status).toBe(200)
    const data = await getResponse.json()
    expect(data.id).toBe(itemId)
    expect(data.name).toBe('Test Item')
  })

  it('handler with store.update() updates item', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': "return store.create('items', req.body);",
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
        '/items/{id}': {
          put: {
            'x-handle': "return store.update('items', req.params.id, req.body);",
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

    // Create an item
    const createResponse = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Original Name' }),
    })

    const created = await createResponse.json()
    const itemId = created.id

    // Update the item
    const updateResponse = await server.request(`/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Updated Name' }),
    })

    expect(updateResponse.status).toBe(200)
    const data = await updateResponse.json()
    expect(data.id).toBe(itemId)
    expect(data.name).toBe('Updated Name')
  })

  it('handler with store.delete() deletes item', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': "return store.create('items', req.body);",
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
          get: {
            'x-handle': "return store.list('items');",
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
        '/items/{id}': {
          delete: {
            'x-handle': "return store.delete('items', req.params.id);",
            responses: {
              '204': {
                description: 'No Content',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Create an item
    const createResponse = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    })

    const created = await createResponse.json()
    const itemId = created.id

    // Delete the item
    const deleteResponse = await server.request(`/items/${itemId}`, {
      method: 'DELETE',
    })

    expect(deleteResponse.status).toBe(204)
    const deleteData = await deleteResponse.text()
    expect(deleteData).toBe('')

    // Verify item is deleted
    const listResponse = await server.request('/items')
    const items = await listResponse.json()
    expect(items).toHaveLength(0)
  })

  it('handler with faker generates data', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          post: {
            'x-handle': `
              const uuid = faker.string.uuid();
              const name = faker.person.fullName();
              return store.create('users', { id: uuid, name });
            `,
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(typeof data.id).toBe('string')
    expect(typeof data.name).toBe('string')
  })

  it('handler with req.body accesses request body', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': `
              const uuid = faker.string.uuid();
              return store.create('items', { id: uuid, ...req.body });
            `,
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'My Item', content: 'Item content' }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data.title).toBe('My Item')
    expect(data.content).toBe('Item content')
  })

  it('handler with req.params accesses path parameters', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          get: {
            'x-handle': "return { id: req.params.id, message: 'Found item' };",
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

    const response = await server.request('/items/123')

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('123')
    expect(data.message).toBe('Found item')
  })

  it('handler with req.query accesses query parameters', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/search': {
          get: {
            'x-handle': 'return { query: req.query.q, limit: req.query.limit };',
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

    const response = await server.request('/search?q=test&limit=10')

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.query).toBe('test')
    expect(data.limit).toBe('10')
  })

  it('handler error returns 500 and logs to console', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/error': {
          get: {
            'x-handle': 'throw new Error("Test error");',
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

    const response = await server.request('/error')

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data).toHaveProperty('message')
    expect(data.message).toContain('Test error')

    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('handler return value replaces OpenAPI response', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/custom': {
          get: {
            'x-handle': "return { custom: 'response', value: 42 };",
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      should: 'not appear',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/custom')

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.custom).toBe('response')
    expect(data.value).toBe(42)
    expect(data).not.toHaveProperty('should')
  })

  it('multiple operations can use different handlers', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/articles': {
          get: {
            'x-handle': "return store.list('articles');",
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
          post: {
            'x-handle': `
              const uuid = faker.string.uuid();
              return store.create('articles', { id: uuid, ...req.body });
            `,
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Create an article
    const createResponse = await server.request('/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Article 1', content: 'Content 1' }),
    })

    expect(createResponse.status).toBe(201)
    const created = await createResponse.json()

    // List articles
    const listResponse = await server.request('/articles')
    expect(listResponse.status).toBe(200)
    const articles = await listResponse.json()
    expect(articles).toHaveLength(1)
    expect(articles[0].id).toBe(created.id)
  })

  it('store persists data across requests', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': "return store.create('items', req.body);",
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
          get: {
            'x-handle': "return store.list('items');",
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

    // Create first item
    const createResponse1 = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Item 1' }),
    })

    expect(createResponse1.status).toBe(201)

    // Create second item
    const createResponse2 = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Item 2' }),
    })

    expect(createResponse2.status).toBe(201)

    // List items - should have both
    const listResponse = await server.request('/items')
    expect(listResponse.status).toBe(200)
    const items = await listResponse.json()
    expect(items).toHaveLength(2)
    expect(items.map((item: any) => item.name)).toContain('Item 1')
    expect(items.map((item: any) => item.name)).toContain('Item 2')
  })

  it('handler with store.get() returns 404 when item not found', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          get: {
            'x-handle': "return store.get('items', req.params.id);",
            responses: {
              '200': {
                description: 'OK',
              },
              '404': {
                description: 'Not Found',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Try to get non-existent item
    const getResponse = await server.request('/items/non-existent-id')

    expect(getResponse.status).toBe(404)
    const data = await getResponse.json()
    // When handler returns undefined, JSON response is null
    expect(data).toBeNull()
  })

  it('handler with store.get() returns 404 when item is null', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          get: {
            'x-handle': `
              const item = store.get('items', req.params.id);
              return item === null ? null : item;
            `,
            responses: {
              '200': {
                description: 'OK',
              },
              '404': {
                description: 'Not Found',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Try to get non-existent item
    const getResponse = await server.request('/items/non-existent-id')

    expect(getResponse.status).toBe(404)
  })

  it('handler with store.update() returns 404 when item not found', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          put: {
            'x-handle': "return store.update('items', req.params.id, req.body);",
            responses: {
              '200': {
                description: 'OK',
              },
              '404': {
                description: 'Not Found',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Try to update non-existent item
    const updateResponse = await server.request('/items/non-existent-id', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Updated Name' }),
    })

    expect(updateResponse.status).toBe(404)
    const data = await updateResponse.json()
    expect(data).toBeNull()
  })

  it('handler with store.delete() returns 404 when item not found', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          delete: {
            'x-handle': "return store.delete('items', req.params.id);",
            responses: {
              '204': {
                description: 'No Content',
              },
              '404': {
                description: 'Not Found',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Try to delete non-existent item
    const deleteResponse = await server.request('/items/non-existent-id', {
      method: 'DELETE',
    })

    expect(deleteResponse.status).toBe(404)
    const data = await deleteResponse.json()
    expect(data).toBeNull()
  })

  it('handler with store.delete() returns 204 with no body', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': "return store.create('items', req.body);",
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
        '/items/{id}': {
          delete: {
            'x-handle': "return store.delete('items', req.params.id);",
            responses: {
              '204': {
                description: 'No Content',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Create an item
    const createResponse = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    })

    const created = await createResponse.json()
    const itemId = created.id

    // Delete the item
    const deleteResponse = await server.request(`/items/${itemId}`, {
      method: 'DELETE',
    })

    expect(deleteResponse.status).toBe(204)
    const contentType = deleteResponse.headers.get('Content-Type')
    expect(contentType).toBeNull()
    const body = await deleteResponse.text()
    expect(body).toBe('')
  })

  it('handler returns 404 with example response when item not found', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          get: {
            'x-handle': "return store.get('items', req.params.id);",
            responses: {
              '200': {
                description: 'OK',
              },
              '404': {
                description: 'Not Found',
                content: {
                  'application/json': {
                    example: {
                      error: 'Item not found',
                      message: 'The requested item does not exist',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    // Try to get non-existent item
    const getResponse = await server.request('/items/non-existent-id')

    expect(getResponse.status).toBe(404)
    const data = await getResponse.json()
    expect(data).toEqual({
      error: 'Item not found',
      message: 'The requested item does not exist',
    })
  })

  it('handler returns 404 with example from schema when item not found', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          get: {
            'x-handle': "return store.get('items', req.params.id);",
            responses: {
              '200': {
                description: 'OK',
              },
              '404': {
                description: 'Not Found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: {
                          type: 'string',
                          example: 'Not Found',
                        },
                        code: {
                          type: 'number',
                          example: 404,
                        },
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

    const server = await createMockServer({ document })

    // Try to get non-existent item
    const getResponse = await server.request('/items/non-existent-id')

    expect(getResponse.status).toBe(404)
    const data = await getResponse.json()
    expect(data).toHaveProperty('error')
    expect(data).toHaveProperty('code')
    expect(data.error).toBe('Not Found')
    expect(data.code).toBe(404)
  })

  it('handler returns 201 with example response when handler explicitly returns null after create', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': `
              store.create('items', req.body);
              return null;
            `,
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    example: {
                      id: '123e4567-e89b-12d3-a456-426614174000',
                      name: 'Example Item',
                      createdAt: '2024-01-01T00:00:00Z',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    // Handler returns null but status is 201, so should use example
    expect(data).toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Example Item',
      createdAt: '2024-01-01T00:00:00Z',
    })
  })

  it('handler returns 201 with example from schema when handler explicitly returns null after create', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          post: {
            'x-handle': `
              store.create('items', req.body);
              return null;
            `,
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          format: 'uuid',
                        },
                        name: {
                          type: 'string',
                          example: 'Created Item',
                        },
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

    const server = await createMockServer({ document })

    const response = await server.request('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    // Since handler returns null but status is 201, should use example from schema
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(data.name).toBe('Created Item')
  })

  it('handler result takes precedence over example response', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items/{id}': {
          get: {
            'x-handle': "return { id: req.params.id, custom: 'handler-value' };",
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      id: 'example-id',
                      custom: 'example-value',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/items/actual-id')

    expect(response.status).toBe(200)
    const data = await response.json()
    // Handler returns a value, so it should be used instead of example
    expect(data).toEqual({
      id: 'actual-id',
      custom: 'handler-value',
    })
    expect(data.custom).not.toBe('example-value')
  })
})
