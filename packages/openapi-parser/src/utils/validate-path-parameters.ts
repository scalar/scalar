import type { AnyObject, ErrorObject } from '@/types/index'

/**
 * Extracts path parameter names from a URL path template.
 * e.g., "/pets/{petId}/toys/{toyId}" → ["petId", "toyId"]
 */
function getPathTemplateParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g)
  if (!matches) {
    return []
  }
  return matches.map((m) => m.slice(1, -1))
}

/**
 * Collects path parameters from a parameters array.
 */
function getPathParamsFromArray(
  parameters: AnyObject[] | undefined,
): Array<{ name: string; index: number }> {
  if (!Array.isArray(parameters)) {
    return []
  }
  return parameters
    .map((param, index) => ({ param, index }))
    .filter(({ param }) => param?.in === 'path')
    .map(({ param, index }) => ({ name: param.name as string, index }))
}

/**
 * Validates that path parameters declared on operations and path items
 * actually correspond to template segments in the path string, and vice versa.
 *
 * Returns semantic errors for:
 * 1. Path parameters defined on an operation/path that don't have a matching
 *    {param} segment in the path template (unused parameters).
 * 2. Path template segments {param} that don't have a corresponding path
 *    parameter defined at either the path or operation level (missing parameters).
 *
 * @see https://spec.openapis.org/oas/v3.1.0.html#path-item-object
 */
export function validatePathParameters(specification: AnyObject): ErrorObject[] {
  const errors: ErrorObject[] = []

  const paths = specification?.paths
  if (!paths || typeof paths !== 'object') {
    return errors
  }

  const httpMethods = new Set([
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ])

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue
    }

    const templateParams = getPathTemplateParams(path)
    const pathLevelParams = getPathParamsFromArray(
      (pathItem as AnyObject).parameters as AnyObject[],
    )

    // Check each operation on this path
    for (const [method, operation] of Object.entries(pathItem as AnyObject)) {
      if (!httpMethods.has(method) || !operation || typeof operation !== 'object') {
        continue
      }

      const operationParams = getPathParamsFromArray(
        (operation as AnyObject).parameters as AnyObject[],
      )

      // Combine path-level and operation-level params (operation overrides path)
      const allDefinedParams = new Map<string, { level: string; index: number }>()

      for (const p of pathLevelParams) {
        allDefinedParams.set(p.name, { level: 'path', index: p.index })
      }
      for (const p of operationParams) {
        allDefinedParams.set(p.name, { level: 'operation', index: p.index })
      }

      // Check for unused path parameters (defined but not in template)
      for (const [paramName, info] of allDefinedParams) {
        if (!templateParams.includes(paramName)) {
          const location =
            info.level === 'operation'
              ? ['paths', path, method, 'parameters', String(info.index), 'name']
              : ['paths', path, 'parameters', String(info.index), 'name']

          errors.push({
            message: `Path parameter "${paramName}" must have the corresponding {${paramName}} segment in the "${path}" path`,
            path: location,
          })
        }
      }

      // Check for missing path parameters (in template but not defined)
      for (const templateParam of templateParams) {
        if (!allDefinedParams.has(templateParam)) {
          errors.push({
            message: `Declared path parameter "${templateParam}" needs to be defined as a path parameter at either the path or operation level`,
            path: ['paths', path, method],
          })
        }
      }
    }

    // If no operations exist, still check path-level params against template
    const hasOperations = Object.keys(pathItem as AnyObject).some((k) => httpMethods.has(k))
    if (!hasOperations && pathLevelParams.length > 0) {
      for (const p of pathLevelParams) {
        if (!templateParams.includes(p.name)) {
          errors.push({
            message: `Path parameter "${p.name}" must have the corresponding {${p.name}} segment in the "${path}" path`,
            path: ['paths', path, 'parameters', String(p.index), 'name'],
          })
        }
      }
    }
  }

  return errors
}
