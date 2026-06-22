import { normalize } from '@scalar/json-magic/helpers/normalize'
import type { Context } from 'hono'
import { stringify as toYaml } from 'yaml'

/**
 * OpenAPI endpoints
 */
export function respondWithOpenApiDocument(
  c: Context,
  input?: string | Record<string, any>,
  format: 'json' | 'yaml' = 'json',
) {
  if (!input) {
    return c.text('Not found', 404)
  }

  try {
    const document = normalize(input)

    // JSON
    if (format === 'json') {
      return c.json(document)
    }

    // YAML
    try {
      const yamlDocument = toYaml(normalize(document))

      c.header('Content-Type', 'text/yaml')
      return c.text(yamlDocument, 200, {
        'Content-Type': 'application/yaml; charset=UTF-8',
      })
    } catch (error) {
      return c.json(
        {
          error: 'Failed to convert document to YAML',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        500,
      )
    }
  } catch (error) {
    return c.json(
      {
        error: 'Failed to parse OpenAPI document',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      400,
    )
  }
}
