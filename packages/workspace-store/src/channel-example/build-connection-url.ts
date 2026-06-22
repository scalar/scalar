import { isObject } from '@scalar/helpers/object/is-object'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { combineUrlAndPath, mergeUrls } from '@scalar/helpers/url/merge-urls'
import type {
  AsyncApiChannelObject,
  AsyncApiOperationObject,
  AsyncApiServerObject,
  AsyncApiWsBindingObject,
} from '@scalar/types/asyncapi/3.1'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

/** AsyncAPI server protocols supported for WebSocket connections in the API client MVP. */
export const ASYNCAPI_WEBSOCKET_PROTOCOLS = ['ws', 'wss'] as const

export type AsyncApiWebSocketProtocol = (typeof ASYNCAPI_WEBSOCKET_PROTOCOLS)[number]

export type BuildConnectionUrlInput = {
  server: AsyncApiServerObject
  channel: AsyncApiChannelObject
  operation?: AsyncApiOperationObject | null
  pathParameters?: Record<string, string>
  queryParameters?: Record<string, string>
  environmentVariables?: Record<string, string> | ((key: string) => string | null)
}

type SubstitutionOptions = {
  serverVariables?: Record<string, string>
  environmentVariables?: BuildConnectionUrlInput['environmentVariables']
  pathParameters?: Record<string, string>
}

/**
 * Extracts default values of variables defined on an AsyncAPI Server Object.
 */
export const getAsyncApiServerVariables = (server: AsyncApiServerObject | null): Record<string, string> => {
  if (!server?.variables) {
    return {}
  }

  return objectEntries(server.variables).reduce<Record<string, string>>((acc, [name, variable]) => {
    const resolved = getResolvedRef(variable)
    if (resolved.default != null) {
      acc[String(name)] = String(resolved.default)
    }
    return acc
  }, {})
}

const substituteTemplate = (template: string, options: SubstitutionOptions): string => {
  let result = template

  if (options.serverVariables) {
    result = replacePathVariables(result, options.serverVariables)
  }

  if (options.environmentVariables) {
    result = replaceEnvVariables(result, options.environmentVariables)
  }

  if (options.pathParameters) {
    result = replacePathVariables(result, options.pathParameters)
  }

  return result
}

/**
 * Normalizes an AsyncAPI `protocol` for comparison: trimmed and lowercased.
 *
 * Returns `undefined` when the protocol is missing or blank, so callers can treat
 * "no protocol" distinctly instead of comparing against an empty string.
 */
export const normalizeProtocol = (protocol: string | undefined): string | undefined => {
  const normalized = protocol?.trim().toLowerCase()
  return normalized ? normalized : undefined
}

/** Maps AsyncAPI `server.protocol` to a URL scheme (MVP: ws and wss). */
export const getUrlSchemeFromProtocol = (protocol: string): string => protocol.trim().toLowerCase()

export const isWebSocketProtocol = (protocol: string): protocol is AsyncApiWebSocketProtocol =>
  (ASYNCAPI_WEBSOCKET_PROTOCOLS as readonly string[]).includes(protocol.trim().toLowerCase())

/**
 * Builds the server base URL: scheme, host, and optional pathname (no channel address).
 */
export const buildAsyncApiServerBaseUrl = (
  server: AsyncApiServerObject,
  environmentVariables?: BuildConnectionUrlInput['environmentVariables'],
): string => {
  const serverVariables = getAsyncApiServerVariables(server)
  const scheme = getUrlSchemeFromProtocol(server.protocol)
  const host = substituteTemplate(server.host, { serverVariables, environmentVariables })
  const origin = `${scheme}://${host}`

  if (!server.pathname) {
    return origin
  }

  const pathname = substituteTemplate(server.pathname, { serverVariables, environmentVariables })
  return combineUrlAndPath(origin, pathname)
}

const resolveWsBinding = (
  bindings: AsyncApiChannelObject['bindings'] | AsyncApiOperationObject['bindings'] | undefined,
): AsyncApiWsBindingObject | undefined => {
  if (!bindings) {
    return undefined
  }

  const resolved = getResolvedRef(bindings)
  return resolved.ws
}

/** Merges channel and operation WebSocket bindings; operation fields override channel. */
export const mergeWsBindings = (
  channel: AsyncApiChannelObject,
  operation?: AsyncApiOperationObject | null,
): AsyncApiWsBindingObject | undefined => {
  const channelBinding = resolveWsBinding(channel.bindings)
  const operationBinding = operation ? resolveWsBinding(operation.bindings) : undefined

  if (!channelBinding && !operationBinding) {
    return undefined
  }

  return {
    ...channelBinding,
    ...operationBinding,
    query: mergeWsQuerySchemas(channelBinding?.query, operationBinding?.query),
  }
}

/** Inline Schema Object form of a WebSocket binding `query`, with booleans and the Reference wrapper resolved away. */
type WsQuerySchema = Exclude<NonNullable<AsyncApiWsBindingObject['query']>, boolean | { $ref: string }>

const resolveWsQuerySchema = (query: AsyncApiWsBindingObject['query']): WsQuerySchema | undefined => {
  if (!query) {
    return undefined
  }

  const resolved = getResolvedRef(query)
  if (resolved === true || resolved === false || !isObject(resolved)) {
    return undefined
  }

  return resolved
}

const mergeWsQuerySchemas = (
  channelQuery: AsyncApiWsBindingObject['query'],
  operationQuery: AsyncApiWsBindingObject['query'],
): AsyncApiWsBindingObject['query'] => {
  const channelSchema = resolveWsQuerySchema(channelQuery)
  const operationSchema = resolveWsQuerySchema(operationQuery)

  if (!channelSchema && !operationSchema) {
    return undefined
  }

  if (!channelSchema) {
    return operationQuery
  }

  if (!operationSchema) {
    return channelQuery
  }

  // `properties` only exists on the object-schema branch of the Schema Object union,
  // so reach it through an `in` check rather than assuming it is present.
  const channelProperties = 'properties' in channelSchema ? channelSchema.properties : undefined
  const operationProperties = 'properties' in operationSchema ? operationSchema.properties : undefined

  // Merge via Object.assign so the result is an intersection of the two schemas rather than a
  // distributed union of every Schema Object variant, which keeps it assignable to the query type.
  return Object.assign({}, channelSchema, operationSchema, {
    properties: {
      ...channelProperties,
      ...operationProperties,
    },
  })
}

const getDefaultValueFromPropertySchema = (propertySchema: unknown): unknown | undefined => {
  if (propertySchema === true || propertySchema === false || !isObject(propertySchema)) {
    return undefined
  }

  if ('default' in propertySchema && propertySchema.default !== undefined) {
    return propertySchema.default
  }

  if ('example' in propertySchema && propertySchema.example !== undefined) {
    return propertySchema.example
  }

  if ('enum' in propertySchema && Array.isArray(propertySchema.enum) && propertySchema.enum[0] !== undefined) {
    return propertySchema.enum[0]
  }

  return undefined
}

const appendQueryValue = (params: URLSearchParams, key: string, value: unknown): void => {
  if (value === undefined || value === null) {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => appendQueryValue(params, key, entry))
    return
  }

  if (typeof value === 'object') {
    params.append(key, JSON.stringify(value))
    return
  }

  params.append(key, String(value))
}

/**
 * Builds handshake query parameters from merged `bindings.ws.query` schema defaults,
 * then applies explicit overrides.
 */
export const buildWsQueryParams = (
  wsBinding: AsyncApiWsBindingObject | undefined,
  queryParameters?: Record<string, string>,
): URLSearchParams => {
  const params = new URLSearchParams()
  const querySchema = resolveWsQuerySchema(wsBinding?.query)

  const properties = querySchema && 'properties' in querySchema ? querySchema.properties : undefined
  if (isObject(properties)) {
    for (const [name, propertySchema] of Object.entries(properties)) {
      const defaultValue = getDefaultValueFromPropertySchema(propertySchema)
      appendQueryValue(params, name, defaultValue)
    }
  }

  if (queryParameters) {
    for (const [name, value] of objectEntries(queryParameters)) {
      params.delete(name)
      appendQueryValue(params, name, value)
    }
  }

  return params
}

/**
 * Builds a WebSocket connection URL from a resolved server, channel, and optional operation.
 *
 * Composition (AsyncAPI 3.x):
 * 1. `server.protocol` → URL scheme
 * 2. `server.host` (+ variables and environment substitution)
 * 3. Optional `server.pathname`
 * 4. Channel `address` (+ path parameter substitution)
 * 5. Query string from merged `bindings.ws.query` (channel + operation) with schema defaults
 */
export const buildConnectionUrl = ({
  server,
  channel,
  operation = null,
  pathParameters = {},
  queryParameters = {},
  environmentVariables,
}: BuildConnectionUrlInput): string => {
  const serverVariables = getAsyncApiServerVariables(server)
  const baseUrl = buildAsyncApiServerBaseUrl(server, environmentVariables)
  const address = channel.address

  if (address == null || address === '') {
    const queryParams = buildWsQueryParams(mergeWsBindings(channel, operation), queryParameters)
    return mergeUrls(baseUrl, '', queryParams, true)
  }

  const resolvedAddress = substituteTemplate(address, {
    serverVariables,
    environmentVariables,
    pathParameters,
  })
  const queryParams = buildWsQueryParams(mergeWsBindings(channel, operation), queryParameters)

  return mergeUrls(baseUrl, resolvedAddress, queryParams, true)
}
