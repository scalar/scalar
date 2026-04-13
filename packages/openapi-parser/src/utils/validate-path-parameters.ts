import type { AnyObject, ErrorObject } from '@/types/index'

const PATH_PARAMETER_PATTERN = /{([^}]+)}/g
const OPERATION_KEYS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'])

type PathParameter = {
  name: string
  path: string[]
}

/**
 * Validates path-template semantics that are not enforced by the JSON schema.
 */
export function validatePathParameters(specification: AnyObject): ErrorObject[] {
  const paths = specification?.paths

  if (!paths || typeof paths !== 'object') {
    return []
  }

  const errors: ErrorObject[] = []

  for (const [pathName, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) {
      continue
    }

    const operations = Object.entries(pathItem).filter(
      ([key, value]) => OPERATION_KEYS.has(key) && isRecord(value),
    ) as Array<[string, AnyObject]>

    // Preserve the repo's current behaviour for empty path items.
    if (operations.length === 0) {
      continue
    }

    const templateParameters = new Set(getTemplateParameterNames(pathName))
    const pathLevelParameters = getPathParameters(pathItem.parameters, ['paths', pathName, 'parameters'])

    for (const parameter of pathLevelParameters) {
      if (!templateParameters.has(parameter.name)) {
        errors.push({
          path: parameter.path,
          message: `Path parameter "${parameter.name}" must have the corresponding {${parameter.name}} segment in the "${pathName}" path`,
        })
      }
    }

    for (const [operationKey, operation] of operations) {
      const operationParameters = getPathParameters(operation.parameters, [
        'paths',
        pathName,
        operationKey,
        'parameters',
      ])

      for (const parameter of operationParameters) {
        if (!templateParameters.has(parameter.name)) {
          errors.push({
            path: parameter.path,
            message: `Path parameter "${parameter.name}" must have the corresponding {${parameter.name}} segment in the "${pathName}" path`,
          })
        }
      }

      const effectiveParameters = new Set(
        [...pathLevelParameters, ...operationParameters].map((parameter) => parameter.name),
      )

      for (const templateParameter of templateParameters) {
        if (!effectiveParameters.has(templateParameter)) {
          errors.push({
            path: ['paths', pathName, operationKey],
            message: `Declared path parameter "${templateParameter}" needs to be defined as a path parameter at either the path or operation level`,
          })
        }
      }
    }
  }

  return deduplicateErrors(errors)
}

function getTemplateParameterNames(pathName: string) {
  return [...pathName.matchAll(PATH_PARAMETER_PATTERN)].map((match) => normalizeTemplateParameterName(match[1]))
}

function normalizeTemplateParameterName(name: string) {
  return name.endsWith('+') ? name.slice(0, -1) : name
}

function getPathParameters(parameters: unknown, pathPrefix: string[]): PathParameter[] {
  if (!Array.isArray(parameters)) {
    return []
  }

  return parameters.flatMap((parameter, index) => {
    if (!isRecord(parameter) || parameter.in !== 'path' || typeof parameter.name !== 'string') {
      return []
    }

    return [
      {
        name: parameter.name,
        path: [...pathPrefix, String(index), 'name'],
      },
    ]
  })
}

function deduplicateErrors(errors: ErrorObject[]) {
  const seen = new Set<string>()

  return errors.filter((error) => {
    const key = `${error.message}||${error.path?.join('.') ?? ''}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

function isRecord(value: unknown): value is AnyObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
