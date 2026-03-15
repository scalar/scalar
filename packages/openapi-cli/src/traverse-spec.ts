import type { OpenAPI } from '@scalar/openapi-types'

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'] as const

type ParamLike = { name: string; in?: string; schema?: { type?: string }; description?: string }

function isParam(obj: unknown): obj is ParamLike {
  return typeof obj === 'object' && obj !== null && 'name' in obj
}

function getParams(operation: Record<string, unknown>, pathItem?: Record<string, unknown>): ParamLike[] {
  const opParams = (operation.parameters as unknown[]) ?? []
  const pathParams = (pathItem?.parameters as unknown[]) ?? []
  const combined = [...pathParams, ...opParams]
  return combined.filter(isParam)
}

/**
 * Derive prefix segments (version/namespace) from path, e.g. /v2/core/accounts -> [v2, core]
 * and resource from the last segment: accounts.
 */
function pathToPrefixAndResource(path: string): { prefix: string[]; resource: string } {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return { prefix: [], resource: '' }
  const resource = segments[segments.length - 1]!
  const prefix = segments.slice(0, -1)
  return { prefix, resource }
}

/**
 * Derive action name from operationId or method.
 * Prefer operationId (camelCase) and use as-is; otherwise create/list/retrieve/update/delete from method.
 */
function toAction(operation: Record<string, unknown>, method: string): string {
  const operationId = operation.operationId
  if (typeof operationId === 'string' && operationId.trim()) {
    return operationId
  }
  const actionMap: Record<string, string> = {
    get: 'list',
    post: 'create',
    put: 'update',
    patch: 'update',
    delete: 'delete',
  }
  return actionMap[method] ?? method
}

/**
 * Collect body property names (including nested) for dotted flags.
 * e.g. { identity: { country: string } } -> ['identity.country']
 */
function bodySchemaToFlagKeys(schema: unknown, prefix = ''): string[] {
  if (!schema || typeof schema !== 'object') return []
  const s = schema as Record<string, unknown>
  const props = s.properties as Record<string, unknown> | undefined
  if (!props) return []
  const keys: string[] = []
  for (const [key, value] of Object.entries(props)) {
    const kebab = key
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
    const dot = prefix ? `${prefix}.${kebab}` : kebab
    keys.push(dot)
    if (value && typeof value === 'object' && (value as Record<string, unknown>).properties) {
      keys.push(...bodySchemaToFlagKeys(value, dot))
    }
  }
  return keys
}

export type TraversedOperation = {
  path: string
  method: string
  operation: Record<string, unknown>
  pathParams: ParamLike[]
  queryParams: ParamLike[]
  headerParams: ParamLike[]
  bodyFlagKeys: string[]
  prefixSegments: string[]
  resource: string
  action: string
}

export function traverseSpec(spec: OpenAPI.Document): TraversedOperation[] {
  const paths = (spec as Record<string, unknown>).paths as Record<string, Record<string, unknown>> | undefined
  if (!paths) return []

  const result: TraversedOperation[] = []

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as Record<string, unknown> | undefined
      if (!operation || typeof operation !== 'object') continue

      const allParams = getParams(operation, pathItem)
      const pathParams = allParams.filter((p) => p.in === 'path')
      const queryParams = allParams.filter((p) => p.in === 'query')
      const headerParams = allParams.filter((p) => p.in === 'header')

      let bodyFlagKeys: string[] = []
      const reqBody = operation.requestBody as Record<string, unknown> | undefined
      if (reqBody?.content) {
        const content = reqBody.content as Record<string, { schema?: unknown }>
        const first = Object.values(content)[0]
        if (first?.schema) {
          bodyFlagKeys = bodySchemaToFlagKeys(first.schema)
        }
      }

      const { prefix: prefixSegments, resource } = pathToPrefixAndResource(path)
      const action = toAction(operation, method)

      result.push({
        path,
        method,
        operation,
        pathParams,
        queryParams,
        headerParams,
        bodyFlagKeys,
        prefixSegments,
        resource,
        action,
      })
    }
  }

  return result
}
