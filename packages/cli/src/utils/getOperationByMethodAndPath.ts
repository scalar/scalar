import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

type PathItemObject = Record<string, OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject>

export function getOperationByMethodAndPath(schema: OpenAPI.Document, method: string, path: string) {
  // Normalization
  const normalizedMethod = method.toString().toLowerCase()
  const pathObject = schema.paths?.[path] as PathItemObject

  // Direct match
  if (pathObject?.[normalizedMethod]) {
    return pathObject[normalizedMethod]
  }

  // Loop through all pathRegex and find the one where the regex matches the path

  // Create a Regex for all paths with variables
  const pathRegex = Object.keys(schema.paths ?? {})
    // Has variables?
    .filter((item) => item.includes('{'))
    .map((operationPath) => {
      return {
        path: operationPath,
        regex: new RegExp(operationPath.replace(/{([^}]+)}/g, (_, name) => `(?<${name}>[^/]+)`)),
      }
    })

  // Find a Regex that matches the given path
  const matchedPath = pathRegex.find(({ regex }) => regex.test(path))
  const matchedPathObject = schema.paths?.[matchedPath?.path as string] as PathItemObject

  // Return the operation
  if (matchedPath?.path) {
    return matchedPathObject?.[normalizedMethod]
  }

  return null
}
