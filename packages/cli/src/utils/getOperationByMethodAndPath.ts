import type { OpenAPI } from 'openapi-types'

export function getOperationByMethodAndPath(
  schema: OpenAPI.Document,
  method: string,
  path: string,
) {
  // Compare just the strings
  if (schema.paths?.[path]?.[method.toLowerCase()]) {
    return schema.paths?.[path]?.[method.toLowerCase()]
  }

  // Loop through all pathRegex and find the one where the regex matches the path

  // Create a Regex for all paths with variables
  const pathRegex = Object.keys(schema.paths ?? {})
    .filter((path) => {
      return path.includes('{')
    })
    .map((operationPath) => {
      return {
        path: operationPath,
        regex: new RegExp(
          operationPath.replace(/{([^}]+)}/g, (_, name) => `(?<${name}>[^/]+)`),
        ),
      }
    })

  // Find a Regex that matches the given path
  const matchedPath = pathRegex.find(({ regex }) => regex.test(path))

  // Return the operation
  if (matchedPath?.path) {
    return schema.paths?.[matchedPath?.path]?.[method.toLowerCase()]
  }

  return null
}
