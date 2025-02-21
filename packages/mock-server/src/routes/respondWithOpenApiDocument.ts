import { openapi } from '@scalar/openapi-parser'
import type { Context } from 'hono'

/**
 * OpenAPI endpoints
 */
export async function respondWithOpenApiDocument(
  c: Context,
  input?: string | Record<string, any>,
  format: 'json' | 'yaml' = 'json',
) {
  if (!input) {
    return c.text('Not found', 404)
  }

  try {
    const { specification } = await openapi().load(input).get()

    // JSON
    if (format === 'json') {
      return c.json(specification)
    }

    // YAML
    try {
      const yamlSpecification = await openapi().load(input).toYaml()
      c.header('Content-Type', 'text/yaml')
      return c.text(yamlSpecification, 200, {
        'Content-Type': 'application/yaml; charset=UTF-8',
      })
    } catch (error) {
      return c.json(
        {
          error: 'Failed to convert specification to YAML',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        500,
      )
    }
  } catch (error) {
    return c.json(
      {
        error: 'Failed to parse OpenAPI specification',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      400,
    )
  }
}
