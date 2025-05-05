import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { describe, expect, it } from 'vitest' // or 'jest'
import { createScalarApiReference } from './create-scalar-api-reference'

describe('createScalarApiReference', () => {
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

    const markdown = `# Test API (1.0.0)

OpenAPI 3.1.1

Test description`

    expectMarkdownToBeRendered(content, markdown)
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

    const markdown = `## Servers

- **URL:** \`https://test.com\`
  - **Description:** Test server

- **URL:** \`https://test.com/{version}\`
  - **Description:** Test server v2
  - **Variables:**
    - \`version\` (default: \`v2\`): Test version
`

    expectMarkdownToBeRendered(content, markdown)
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

    const markdown = `# Test API (1.0.0)

OpenAPI 3.1.1

## Operations

### GET /test

Test operation

Test description`

    expectMarkdownToBeRendered(content, markdown)
  })
})

async function expectMarkdownToBeRendered(content: Record<string, unknown>, markdown: string) {
  const configuration = {
    content,
  } as Partial<ApiReferenceConfiguration>

  const html = await createScalarApiReference(configuration)

  expect(html).toContain(markdown)
}
