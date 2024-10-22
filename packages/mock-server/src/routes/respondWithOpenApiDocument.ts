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
    return c.json(parsedSpec)
  }

  // YAML
  const yamlSpecification = await openapi().load(specification).toYaml()

  return c.text(yamlSpecification)
}
