import { objectEntries } from '@scalar/helpers/object/object-entries'
import type {
  AsyncApiChannelObject,
  AsyncApiOperationObject,
  AsyncApiParameterObject,
} from '@scalar/types/asyncapi/3.1'

import { buildWsQueryParams, mergeWsBindings } from '@/channel-example/build-connection-url'
import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

const PATH_PARAM_PATTERN = /\{([^}]+)\}/g

export type ChannelParametersContext = {
  /** Resolved channel parameter definitions keyed by name. */
  definitions: Record<string, AsyncApiParameterObject>
  /** Values substituted into the channel address path segments. */
  path: Record<string, string>
  /** Values substituted into WebSocket handshake query parameters. */
  query: Record<string, string>
}

const getPathParameterNames = (address: string | null | undefined): string[] => {
  if (address == null || address === '') {
    return []
  }

  const names: string[] = []
  for (const match of address.matchAll(PATH_PARAM_PATTERN)) {
    const name = match[1]
    if (name && !names.includes(name)) {
      names.push(name)
    }
  }

  return names
}

const getDefaultParameterValue = (parameter: AsyncApiParameterObject): string => {
  if (parameter.default != null) {
    return String(parameter.default)
  }

  if (parameter.examples?.[0] != null) {
    return String(parameter.examples[0])
  }

  if (parameter.enum?.[0] != null) {
    return String(parameter.enum[0])
  }

  return ''
}

/**
 * Builds default path and query parameter values from channel definitions and ws bindings.
 */
export const getChannelParameters = (
  channel: AsyncApiChannelObject,
  operation?: AsyncApiOperationObject | null,
  overrides: Partial<Pick<ChannelParametersContext, 'path' | 'query'>> = {},
): ChannelParametersContext => {
  const definitions: Record<string, AsyncApiParameterObject> = {}

  if (channel.parameters) {
    for (const [name, parameterRef] of objectEntries(channel.parameters)) {
      definitions[name] = getResolvedRef(parameterRef, mergeSiblingReferences)
    }
  }

  const path: Record<string, string> = { ...overrides.path }
  for (const name of getPathParameterNames(channel.address)) {
    if (path[name] == null) {
      const parameter = definitions[name]
      path[name] = parameter ? getDefaultParameterValue(parameter) : ''
    }
  }

  const query: Record<string, string> = { ...overrides.query }
  const wsBinding = mergeWsBindings(channel, operation)
  const defaultQueryParams = buildWsQueryParams(wsBinding)

  defaultQueryParams.forEach((value, key) => {
    if (query[key] == null) {
      query[key] = value
    }
  })

  return {
    definitions,
    path,
    query,
  }
}
