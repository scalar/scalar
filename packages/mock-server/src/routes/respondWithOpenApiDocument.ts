import { openapi } from '@scalar/openapi-parser'
import type { Context } from 'hono'

/**
 * OpenAPI endpoints
 */
export async function respondWithOpenApiDocument(
  c: Context,
  specification?: string | Record<string, any>,
  format: 'json' | 'yaml' = 'json',
) {
  if (!specification) {
    return c.text('Not found', 404)
  }

  const { specification: parsedSpec } = await openapi()
    .load(specification)
    .get()

  // JSON
  if (format === 'json') {
    c.header('Content-Type', 'application/json')
    return c.json(parsedSpec)
  }

  // YAML
  try {
    const yamlSpecification = await openapi().load(specification).toYaml()
    c.header('Content-Type', 'text/yaml')
    return c.text(yamlSpecification)
  } catch (error) {
    return c.json({
      error: 'Failed to convert specification to YAML',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, 500)
  }
}
