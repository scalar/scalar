/**
 * Normalize OpenAPI JSON string, YAML string … to object
 */
export function normalize(openapi: string | Record<string, any>) {
  if (typeof openapi === 'string') {
    openapi = JSON.parse(openapi)
  }

  return openapi
}
