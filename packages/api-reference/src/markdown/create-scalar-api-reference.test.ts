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
})

async function expectMarkdownToBeRendered(content: Record<string, unknown>, markdown: string) {
  const configuration = {
    content,
  } as Partial<ApiReferenceConfiguration>

  const html = await createScalarApiReference(configuration)

  expect(html).toContain(markdown)
}
