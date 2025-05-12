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
})
