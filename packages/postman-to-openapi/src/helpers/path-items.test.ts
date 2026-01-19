import { describe, expect, it } from 'vitest'

import type { Item, ItemGroup } from '@/types'

import { processItem } from './path-items'

describe('path-items', () => {
  it('processes simple GET request', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users/123',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users/123']).toBeDefined()
    expect(result.paths['/users/123']?.get).toBeDefined()
    expect(result.paths['/users/123']?.get?.summary).toBe('Get User')
  })

  it('extracts operation ID from name with brackets', () => {
    const item: Item = {
      name: 'Get User [getUser]',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.operationId).toBe('getUser')
    expect(result.paths['/users']?.get?.summary).toBe('Get User')
  })

  it('handles nested item groups with tags', () => {
    const itemGroup: ItemGroup = {
      name: 'Users',
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = processItem(itemGroup)

    expect(result.paths['/users']?.get?.tags).toEqual(['Users'])
  })

  it('handles deeply nested item groups', () => {
    const itemGroup: ItemGroup = {
      name: 'API',
      item: [
        {
          name: 'Users',
          item: [
            {
              name: 'Get User',
              request: {
                method: 'GET',
                url: {
                  raw: 'https://api.example.com/users',
                },
              },
            },
          ],
        },
      ],
    }

    const result = processItem(itemGroup)

    expect(result.paths['/users']?.get?.tags).toEqual(['API > Users'])
  })

  it('merges paths from multiple items', () => {
    const itemGroup: ItemGroup = {
      name: 'API',
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
        {
          name: 'Create User',
          request: {
            method: 'POST',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = processItem(itemGroup)

    expect(result.paths['/users']?.get).toBeDefined()
    expect(result.paths['/users']?.post).toBeDefined()
  })

  it('processes request with auth and adds security scheme', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
        auth: {
          type: 'bearer',
        },
      },
    }

    const result = processItem(item)

    expect(result.components.securitySchemes).toBeDefined()
    expect(result.components.securitySchemes?.bearerAuth).toBeDefined()
    expect(result.paths['/users']?.get?.security).toBeDefined()
    expect(result.paths['/users']?.get?.security?.[0]).toHaveProperty('bearerAuth')
  })

  it('merges security schemes from nested items', () => {
    const itemGroup: ItemGroup = {
      name: 'API',
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
            auth: {
              type: 'bearer',
            },
          },
        },
        {
          name: 'Create User',
          request: {
            method: 'POST',
            url: {
              raw: 'https://api.example.com/users',
            },
            auth: {
              type: 'apikey',
            },
          },
        },
      ],
    }

    const result = processItem(itemGroup)

    expect(result.components.securitySchemes?.bearerAuth).toBeDefined()
    expect(result.components.securitySchemes?.apikeyAuth).toBeDefined()
  })

  it('extracts path parameters from URL', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: '123',
            },
          ],
        },
        description: 'Get user by ID',
      },
    }

    const result = processItem(item)

    // The path key uses the non-normalized path
    const pathKey = Object.keys(result.paths)[0]
    const params = result.paths[pathKey!]?.get?.parameters
    expect(params).toBeDefined()
    expect(params?.find((p: any) => p.name === 'userId')).toEqual({
      name: 'userId',
      in: 'path',
      required: true,
      description: undefined,
      example: '123',
      schema: {
        type: 'string',
      },
    })
  })

  it('filters out path parameters not in the path', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users/:userId',
          variable: [
            {
              key: 'userId',
              value: '123',
            },
            {
              key: 'invalidParam',
              value: 'test',
            },
          ],
        },
        description: 'Get user by ID',
      },
    }

    const result = processItem(item)

    const pathKey = Object.keys(result.paths)[0]
    const params = result.paths[pathKey!]?.get?.parameters
    expect(params?.find((p: any) => p.name === 'invalidParam')).toBeUndefined()
  })

  it('extracts query parameters', () => {
    const item: Item = {
      name: 'Get Users',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users?page=1&limit=10',
          query: [
            {
              key: 'page',
              value: '1',
            },
            {
              key: 'limit',
              value: '10',
            },
          ],
        },
        description: 'Get users with pagination',
      },
    }

    const result = processItem(item)

    const pathKey = Object.keys(result.paths)[0]
    const params = result.paths[pathKey!]?.get?.parameters
    expect(params?.find((p: any) => p.name === 'page')).toBeDefined()
    expect(params?.find((p: any) => p.name === 'limit')).toBeDefined()
  })

  it('extracts parameters from markdown table in description', () => {
    const item: Item = {
      name: 'Get Users',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
        description: `Get a list of users

| object | name | description | example | type | required |
|--------|------|-------------|---------|------|----------|
| query  | page | Page number | 1       | integer | true |`,
      },
    }

    const result = processItem(item)

    const params = result.paths['/users']?.get?.parameters
    expect(params?.find((p: any) => p.name === 'page')).toEqual({
      name: 'page',
      in: 'query',
      description: 'Page number',
      required: true,
      example: '1',
      schema: {
        type: 'integer',
      },
    })
    expect(result.paths['/users']?.get?.description).toBe('Get a list of users')
  })

  it('removes markdown table from description', () => {
    const item: Item = {
      name: 'Get Users',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
        description: `Get a list of users

| object | name | description |
|--------|------|-------------|
| query  | page | Page number |`,
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.description).toBe('Get a list of users')
    expect(result.paths['/users']?.get?.description).not.toContain('|')
  })

  it('defaults parameter type to string when type is missing from markdown table', () => {
    const item: Item = {
      name: 'Get Users',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
        description: `Get a list of users

| object | name | description | example | required |
|--------|------|-------------|---------|----------|
| query  | filter | Filter string | test | true |`,
      },
    }

    const result = processItem(item)

    const params = result.paths['/users']?.get?.parameters
    expect(params?.find((p: any) => p.name === 'filter')).toEqual({
      name: 'filter',
      in: 'query',
      description: 'Filter string',
      required: true,
      example: 'test',
      schema: {
        type: 'string',
      },
    })
  })

  it('processes POST request with request body', () => {
    const item: Item = {
      name: 'Create User',
      request: {
        method: 'POST',
        url: {
          raw: 'https://api.example.com/users',
        },
        body: {
          mode: 'raw',
          raw: '{"name": "John", "email": "john@example.com"}',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.post?.requestBody).toBeDefined()
    expect(result.paths['/users']?.post?.requestBody?.content?.['application/json']).toBeDefined()
  })

  it('processes PUT request with request body', () => {
    const item: Item = {
      name: 'Update User',
      request: {
        method: 'PUT',
        url: {
          raw: 'https://api.example.com/users/:id',
        },
        body: {
          mode: 'raw',
          raw: '{"name": "John"}',
        },
      },
    }

    const result = processItem(item)

    const pathKey = Object.keys(result.paths)[0]
    expect(result.paths[pathKey!]?.put?.requestBody).toBeDefined()
  })

  it('processes PATCH request with request body', () => {
    const item: Item = {
      name: 'Patch User',
      request: {
        method: 'PATCH',
        url: {
          raw: 'https://api.example.com/users/:id',
        },
        body: {
          mode: 'raw',
          raw: '{"name": "John"}',
        },
      },
    }

    const result = processItem(item)

    const pathKey = Object.keys(result.paths)[0]
    expect(result.paths[pathKey!]?.patch?.requestBody).toBeDefined()
  })

  it('adds request body for GET request when body is provided', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
        body: {
          mode: 'raw',
          raw: '{}',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.requestBody).toBeDefined()
    expect(result.paths['/users']?.get?.requestBody?.content?.['application/json']).toBeDefined()
  })

  it('allows GET requests to have request bodies', () => {
    const item: Item = {
      name: 'Get with Body',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/bedrock',
        },
        body: {
          mode: 'raw',
          raw: '{"data": {"modelId": "mistral.mistral-7b-instruct-v0:2"}}',
          options: {
            raw: {
              language: 'json',
            },
          },
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/bedrock']?.get?.requestBody).toBeDefined()
    expect(result.paths['/bedrock']?.get?.requestBody?.content?.['application/json']).toBeDefined()
    const example = result.paths['/bedrock']?.get?.requestBody?.content?.['application/json']?.schema?.example as any
    expect(example?.data?.modelId).toBe('mistral.mistral-7b-instruct-v0:2')
  })

  it('does not add requestBody when body is empty', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.requestBody).toBeUndefined()
  })

  it('extracts responses from item', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
      },
      response: [
        {
          code: 200,
          status: 'OK',
          body: '{"id": 1, "name": "John"}',
        },
      ],
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.responses?.['200']).toBeDefined()
  })

  it('adds pre-request script extension', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
      },
      event: [
        {
          listen: 'prerequest',
          script: {
            exec: ['pm.environment.set("token", "abc123");'],
          },
        },
      ],
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.['x-pre-request']).toBe('pm.environment.set("token", "abc123");')
  })

  it('adds post-response script extension', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.test("Status is 200", function () {', '  pm.response.to.have.status(200);', '});'],
          },
        },
      ],
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.['x-post-response']).toBe(
      'pm.test("Status is 200", function () {\n  pm.response.to.have.status(200);\n});',
    )
  })

  it('handles string request URL', () => {
    const item: Item = {
      name: 'Get User',
      request: 'https://api.example.com/users',
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get).toBeDefined()
  })

  it('handles object description in request', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users',
        },
        description: {
          content: 'Get user information',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get?.description).toBe('Get user information')
  })

  it('handles item without request', () => {
    const itemGroup: ItemGroup = {
      name: 'Folder',
      item: [],
    }

    const result = processItem(itemGroup)

    expect(Object.keys(result.paths)).toHaveLength(0)
  })

  it('normalizes path parameters from colon to curly braces', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://api.example.com/users/:userId/posts/:postId',
        },
      },
    }

    const result = processItem(item)

    // The path key uses non-normalized path, but parameters are normalized
    const pathKey = Object.keys(result.paths)[0]

    expect(result.paths[pathKey!]).toBeDefined()
  })

  it('handles DELETE request', () => {
    const item: Item = {
      name: 'Delete User',
      request: {
        method: 'DELETE',
        url: {
          raw: 'https://api.example.com/users/:id',
        },
      },
    }

    const result = processItem(item)

    const pathKey = Object.keys(result.paths)[0]
    expect(result.paths[pathKey!]?.delete).toBeDefined()
  })

  it('defaults to GET method when method is missing', () => {
    const item: Item = {
      name: 'Get User',
      request: {
        url: {
          raw: 'https://api.example.com/users',
        },
      },
    }

    const result = processItem(item)

    expect(result.paths['/users']?.get).toBeDefined()
  })

  it('handles item group without name', () => {
    const itemGroup: ItemGroup = {
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = processItem(itemGroup)

    expect(result.paths['/users']?.get?.tags).toBeUndefined()
  })

  describe('disabled parameters and headers', () => {
    it('preserves disabled query parameters in operation', () => {
      const item: Item = {
        name: 'Get Users',
        request: {
          method: 'GET',
          url: {
            raw: 'https://api.example.com/users?page=1&limit=10',
            query: [
              {
                key: 'page',
                value: '1',
                disabled: true,
              },
              {
                key: 'limit',
                value: '10',
              },
            ],
          },
          description: 'Get users with pagination',
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      if (!pathKey) {
        throw new Error('Path key not found')
      }
      const params = result.paths[pathKey!]?.get?.parameters
      const pageParam = params?.find((p: any) => p.name === 'page')
      const limitParam = params?.find((p: any) => p.name === 'limit')

      expect(pageParam).toBeDefined()
      expect((pageParam as any)?.['x-scalar-disabled']).toBe(true)
      expect(limitParam).toBeDefined()
      expect((limitParam as any)?.['x-scalar-disabled']).toBeUndefined()
    })

    it('preserves disabled header parameters in operation', () => {
      const item: Item = {
        name: 'Get Users',
        request: {
          method: 'GET',
          url: {
            raw: 'https://api.example.com/users',
          },
          header: [
            {
              key: 'X-Custom-Header',
              value: 'value',
              disabled: true,
            },
            {
              key: 'X-Another-Header',
              value: 'another',
            },
          ],
          description: 'Get users with custom headers',
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      if (!pathKey) {
        throw new Error('Path key not found')
      }
      const params = result.paths[pathKey!]?.get?.parameters
      const customHeader = params?.find((p: any) => p.name === 'X-Custom-Header')
      const anotherHeader = params?.find((p: any) => p.name === 'X-Another-Header')

      expect(customHeader).toBeDefined()
      expect((customHeader as any)?.['x-scalar-disabled']).toBe(true)
      expect(anotherHeader).toBeDefined()
      expect((anotherHeader as any)?.['x-scalar-disabled']).toBeUndefined()
    })

    it('extracts header parameters even when description is missing', () => {
      const item: Item = {
        name: 'Get Users',
        request: {
          method: 'GET',
          url: {
            raw: 'https://api.example.com/users',
          },
          header: [
            {
              key: 'Host',
              value: 'api.example.com',
              disabled: true,
            },
            {
              key: 'X-Custom-Header',
              value: 'value',
            },
          ],
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      if (!pathKey) {
        throw new Error('Path key not found')
      }
      const params = result.paths[pathKey!]?.get?.parameters
      const hostHeader = params?.find((p: any) => p.name === 'Host')
      const customHeader = params?.find((p: any) => p.name === 'X-Custom-Header')

      expect(hostHeader).toBeDefined()
      expect((hostHeader as any)?.['x-scalar-disabled']).toBe(true)
      expect(customHeader).toBeDefined()
      expect((customHeader as any)?.['x-scalar-disabled']).toBeUndefined()
    })

    it('preserves disabled path parameters in operation', () => {
      const item: Item = {
        name: 'Get User',
        request: {
          method: 'GET',
          url: {
            raw: 'https://api.example.com/users/:userId',
            variable: [
              {
                key: 'userId',
                value: '123',
                disabled: true,
              } as any,
            ],
          },
          description: 'Get a specific user',
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      const params = result.paths[pathKey!]?.get?.parameters
      const userIdParam = params?.find((p: any) => p.name === 'userId')

      expect(userIdParam).toBeDefined()
      expect((userIdParam as any)?.['x-scalar-disabled']).toBe(true)
      expect(userIdParam?.required).toBe(true)
    })

    it('preserves disabled urlencoded parameters in request body', () => {
      const item: Item = {
        name: 'Create User',
        request: {
          method: 'POST',
          url: {
            raw: 'https://api.example.com/users',
          },
          body: {
            mode: 'urlencoded',
            urlencoded: [
              {
                key: 'name',
                value: 'John',
                disabled: true,
              },
              {
                key: 'email',
                value: 'john@example.com',
              },
            ],
          },
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      if (!pathKey) {
        throw new Error('Path key not found')
      }
      const requestBody = result.paths[pathKey!]?.post?.requestBody
      const schema = requestBody?.content?.['application/x-www-form-urlencoded']?.schema

      expect(schema?.properties?.name?.['x-scalar-disabled']).toBe(true)
      expect(schema?.properties?.email?.['x-scalar-disabled']).toBeUndefined()
    })

    it('preserves disabled formdata parameters in request body', () => {
      const item: Item = {
        name: 'Upload File',
        request: {
          method: 'POST',
          url: {
            raw: 'https://api.example.com/upload',
          },
          body: {
            mode: 'formdata',
            formdata: [
              {
                key: 'file',
                type: 'file',
                src: null,
                disabled: true,
              },
              {
                key: 'description',
                value: 'File description',
                type: 'text',
              },
            ],
          },
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      if (!pathKey) {
        throw new Error('Path key not found')
      }
      const requestBody = result.paths[pathKey!]?.post?.requestBody
      const schema = requestBody?.content?.['multipart/form-data']?.schema

      expect(schema?.properties?.file?.['x-scalar-disabled']).toBe(true)
      expect(schema?.properties?.description?.['x-scalar-disabled']).toBeUndefined()
    })

    it('handles mixed enabled and disabled parameters correctly', () => {
      const item: Item = {
        name: 'Get Users',
        request: {
          method: 'GET',
          url: {
            raw: 'https://api.example.com/users?enabled=1&disabled=0',
            query: [
              {
                key: 'enabled',
                value: '1',
              },
              {
                key: 'disabled',
                value: '0',
                disabled: true,
              },
            ],
          },
          header: [
            {
              key: 'X-Enabled-Header',
              value: 'enabled',
            },
            {
              key: 'X-Disabled-Header',
              value: 'disabled',
              disabled: true,
            },
          ],
          description: 'Get users with mixed parameters',
        },
      }

      const result = processItem(item)

      const pathKey = Object.keys(result.paths)[0]
      if (!pathKey) {
        throw new Error('Path key not found')
      }
      const params = result.paths[pathKey!]?.get?.parameters

      const enabledQuery = params?.find((p: any) => p.name === 'enabled')
      const disabledQuery = params?.find((p: any) => p.name === 'disabled')
      const enabledHeader = params?.find((p: any) => p.name === 'X-Enabled-Header')
      const disabledHeader = params?.find((p: any) => p.name === 'X-Disabled-Header')

      expect((enabledQuery as any)?.['x-scalar-disabled']).toBeUndefined()
      expect((disabledQuery as any)?.['x-scalar-disabled']).toBe(true)
      expect((enabledHeader as any)?.['x-scalar-disabled']).toBeUndefined()
      expect((disabledHeader as any)?.['x-scalar-disabled']).toBe(true)
    })
  })
})
