import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { type IncomingMessage, type ServerResponse, createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'

describe('createMarkdownFromOpenApi', () => {
  it('renders title, version and OpenAPI version', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test description',
      },
      paths: {},
    }

    const markdown = `# Test API

- **OpenAPI Version:** \`3.1.1\`
- **API Version:** \`1.0.0\`

Test description`

    const result = await createMarkdownFromOpenApi(content)

    expect(result).toContain(markdown)
  })

  it('renders servers', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://test.com',
          description: 'Test server',
        },
        {
          url: 'https://test.com/{version}',
          description: 'Test server v2',
          variables: {
            version: {
              default: 'v2',
              description: 'Test version',
            },
          },
        },
      ],
      paths: {},
    }

    const markdown = `# Test API

- **OpenAPI Version:** \`3.1.1\`
- **API Version:** \`1.0.0\`

## Servers

- **URL:** \`https://test.com\`
  - **Description:** Test server

- **URL:** \`https://test.com/{version}\`

  - **Description:** Test server v2
  - **Variables:**
    - \`version\` (default: \`v2\`): Test version
`

    const result = await createMarkdownFromOpenApi(content)

    expect(result).toContain(markdown)
  })

  it('renders operations', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test operation',
            description: 'Test description',
          },
        },
      },
    }

    const markdown = `# Test API

- **OpenAPI Version:** \`3.1.1\`
- **API Version:** \`1.0.0\`

## Operations

### Test operation

- **Method:** \`GET\`
- **Path:** \`/test\`

Test description`

    const result = await createMarkdownFromOpenApi(content)

    expect(result).toContain(markdown)
  })

  it('renders request body and response schemas', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          post: {
            summary: 'Create user',
            description: 'Creates a new user',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'User name' },
                      email: { type: 'string', format: 'email' },
                    },
                    required: ['name', 'email'],
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'User created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
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

    const result = await createMarkdownFromOpenApi(content)

    expect(result).toContain('Request Body')
    expect(result).toContain('name')
    expect(result).toContain('email')
    expect(result).toContain('Responses')
    expect(result).toContain('201')
    expect(result).toContain('id')
  })

  it('renders only one operation by path and method', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            operationId: 'listPets',
          },
          post: {
            summary: 'Create pet',
            operationId: 'createPet',
          },
        },
      },
    }

    const result = await createMarkdownFromOpenApi(content, {
      operation: {
        path: '/pets',
        method: 'POST',
      },
    })

    expect(result).toContain('Create pet')
    expect(result).not.toContain('List pets')
    expect(result).toContain('- **Method:**\u00a0`POST`')
  })

  it('renders only one operation by operationId', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            operationId: 'listPets',
          },
        },
        '/pets/{id}': {
          get: {
            summary: 'Get pet',
            operationId: 'getPet',
          },
        },
      },
    }

    const result = await createMarkdownFromOpenApi(content, {
      operation: {
        operationId: 'getPet',
      },
    })

    expect(result).toContain('Get pet')
    expect(result).not.toContain('List pets')
    expect(result).toContain('- **Path:**\u00a0`/pets/{id}`')
  })

  it('renders only one operation by JSON pointer', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            operationId: 'listPets',
          },
          post: {
            summary: 'Create pet',
            operationId: 'createPet',
          },
        },
      },
    }

    const result = await createMarkdownFromOpenApi(content, {
      operation: {
        pointer: '/paths/~1pets/post',
      },
    })

    expect(result).toContain('Create pet')
    expect(result).not.toContain('List pets')
    expect(result).toContain('- **Method:**\u00a0`POST`')
    expect(result).toContain('- **Path:**\u00a0`/pets`')
  })

  it('throws when operationId does not exist', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            operationId: 'listPets',
          },
        },
      },
    }

    await expect(
      createMarkdownFromOpenApi(content, {
        operation: {
          operationId: 'unknownOperation',
        },
      }),
    ).rejects.toThrow('Operation with operationId "unknownOperation" was not found')
  })

  it('throws when operationId is duplicated', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            operationId: 'petsOperation',
          },
        },
        '/pets/{id}': {
          get: {
            summary: 'Get pet',
            operationId: 'petsOperation',
          },
        },
      },
    }

    await expect(
      createMarkdownFromOpenApi(content, {
        operation: {
          operationId: 'petsOperation',
        },
      }),
    ).rejects.toThrow('Multiple operations found for operationId "petsOperation". Use { path, method } instead.')
  })

  it('throws when path and method operation is missing', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
          },
        },
      },
    }

    await expect(
      createMarkdownFromOpenApi(content, {
        operation: {
          path: '/pets',
          method: 'post',
        },
      }),
    ).rejects.toThrow('Operation not found for path "/pets" and method "POST"')
  })

  it('throws when method is invalid', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
          },
        },
      },
    }

    await expect(
      createMarkdownFromOpenApi(content, {
        operation: {
          path: '/pets',
          method: 'fetch' as 'get',
        },
      }),
    ).rejects.toThrow('Invalid HTTP method "fetch".')
  })

  it('throws when JSON pointer does not start with "/"', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
          },
        },
      },
    }

    await expect(
      createMarkdownFromOpenApi(content, {
        operation: {
          pointer: 'paths/~1pets/get',
        },
      }),
    ).rejects.toThrow('Invalid JSON pointer "paths/~1pets/get". JSON pointers must start with "/"')
  })

  it('throws when JSON pointer does not target /paths/{path}/{method}', async () => {
    const content = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
          },
        },
      },
    }

    await expect(
      createMarkdownFromOpenApi(content, {
        operation: {
          pointer: '/paths/~1pets',
        },
      }),
    ).rejects.toThrow('JSON pointer "/paths/~1pets" must target an operation object under "/paths/{path}/{method}"')
  })

  it('renders response schemas with language identifiers (JSON and XML)', async () => {
    const content = (contentType: 'application/json' | 'application/xml') => ({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/items': {
          get: {
            summary: 'Get items',
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  [contentType]: {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
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
    })

    const resultJson = await createMarkdownFromOpenApi(content('application/json'))
    const resultXml = await createMarkdownFromOpenApi(content('application/xml'))

    expect(resultJson).toMatchInlineSnapshot(`
      "# Test API

      - **OpenAPI Version:** \`3.1.1\`
      - **API Version:** \`1.0.0\`

      ## Operations

      ### Get items

      - **Method:** \`GET\`
      - **Path:** \`/items\`

      #### Responses

      ##### Status: 200 Successful response

      ###### Content-Type: application/json

      **Array of:**

      - **\`id\`**

        \`string\`

      - **\`name\`**

        \`string\`

      **Example:**

      \`\`\`json
      [
        {
          "id": "",
          "name": ""
        }
      ]
      \`\`\`
      "
    `)
    expect(resultXml).toMatchInlineSnapshot(`
      "# Test API

      - **OpenAPI Version:** \`3.1.1\`
      - **API Version:** \`1.0.0\`

      ## Operations

      ### Get items

      - **Method:** \`GET\`
      - **Path:** \`/items\`

      #### Responses

      ##### Status: 200 Successful response

      ###### Content-Type: application/xml

      **Array of:**

      - **\`id\`**

        \`string\`

      - **\`name\`**

        \`string\`

      **Example:**

      \`\`\`xml
      <?xml version="1.0" encoding="UTF-8"?>
      <0>
        <id></id>
        <name></name>
      </0>
      \`\`\`
      "
    `)
  })

  it('bundles external file references when input is a file path', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'openapi-to-markdown-'))
    const schemaDirectory = join(tempDirectory, 'schemas')
    const openApiFile = join(tempDirectory, 'openapi.yaml')
    const userSchemaFile = join(schemaDirectory, 'user.yaml')

    await mkdir(schemaDirectory, { recursive: true })
    await writeFile(
      openApiFile,
      `openapi: 3.1.1
info:
  title: File Ref API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      summary: Get user
      responses:
        '200':
          description: Ok
          content:
            application/json:
              schema:
                $ref: './schemas/user.yaml#/User'
`,
    )
    await writeFile(
      userSchemaFile,
      `User:
  type: object
  required:
    - id
    - email
  properties:
    id:
      type: string
    email:
      type: string
      format: email
`,
    )

    try {
      const result = await createMarkdownFromOpenApi(openApiFile)
      expect(result).toContain('Get user')
      expect(result).toContain('id')
      expect(result).toContain('email')
    } finally {
      await rm(tempDirectory, { recursive: true, force: true })
    }
  })

  it('bundles external URL references when input is a URL', async () => {
    const openApiDocument = `openapi: 3.1.1
info:
  title: Url Ref API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Ok
          content:
            application/json:
              schema:
                $ref: './schemas/user.yaml#/UserList'
`
    const userSchema = `UserList:
  type: array
  items:
    type: object
    properties:
      id:
        type: string
      name:
        type: string
`

    const server = createServer((request: IncomingMessage, response: ServerResponse) => {
      if (request.url === '/openapi.yaml') {
        response.writeHead(200, { 'Content-Type': 'application/yaml' })
        response.end(openApiDocument)
        return
      }

      if (request.url === '/schemas/user.yaml') {
        response.writeHead(200, { 'Content-Type': 'application/yaml' })
        response.end(userSchema)
        return
      }

      response.writeHead(404)
      response.end()
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve())
    })

    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    const documentUrl = `http://127.0.0.1:${port}/openapi.yaml`

    try {
      const result = await createMarkdownFromOpenApi(documentUrl)
      expect(result).toContain('List users')
      expect(result).toContain('id')
      expect(result).toContain('name')
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
    }
  })
})
