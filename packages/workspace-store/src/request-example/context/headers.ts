import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isParamDisabled } from '@/request-example/builder/header/is-param-disabled'

/** Default Accept header value to accept all response types. */
const DEFAULT_ACCEPT = '*/*'

const CONVENTIONAL_DEFAULT_HEADER_NAMES: Record<string, string> = {
  accept: 'Accept',
  'content-type': 'Content-Type',
  'user-agent': 'User-Agent',
}

/**
 * Restores conventional casing for well-known default headers.
 *
 * We keep this intentionally scoped to the defaults we auto-generate so we do not
 * unexpectedly rewrite user-defined header parameter names.
 */
export const restoreConventionalHeaderName = (headerName: string): string =>
  CONVENTIONAL_DEFAULT_HEADER_NAMES[headerName.toLowerCase()] ?? headerName

/**
 * Restores conventional casing for default header keys.
 */
export const restoreConventionalDefaultHeaderNames = (headers: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(headers).map(([name, value]) => [restoreConventionalHeaderName(name), value]))

/**
 * Lowercase names of **enabled** operation parameters with `in: header` for the given example.
 * Uses the same rules as the request builder (`isParamDisabled`): optional parameters are treated
 * as disabled unless `examples[exampleName]['x-disabled']` is explicitly `false`.
 */
const getEnabledOperationHeaderParameterNames = (operation: OperationObject, exampleName: string): Set<string> => {
  const names = new Set<string>()
  for (const ref of operation.parameters ?? []) {
    const param = getResolvedRef(ref)
    if (param.in !== 'header') {
      continue
    }
    const rawExample = 'examples' in param && param.examples?.[exampleName] ? param.examples[exampleName] : undefined
    const example = rawExample ? getResolvedRef(rawExample) : undefined
    if (!isParamDisabled(param, example)) {
      names.add(param.name.toLowerCase())
    }
  }
  return names
}

const filterDefaultHeadersByVisibility = (
  operation: OperationObject,
  exampleName: string,
  headers: Record<string, string>,
  flags: { hideOverriddenHeaders: boolean; hideDisabledHeaders: boolean },
): Record<string, string> => {
  const headerParamNames = flags.hideOverriddenHeaders
    ? getEnabledOperationHeaderParameterNames(operation, exampleName)
    : null
  const disabledHeaders = flags.hideDisabledHeaders
    ? (operation['x-scalar-disable-parameters']?.['default-headers']?.[exampleName] ?? {})
    : null

  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => {
      const key = name.toLowerCase()
      if (headerParamNames?.has(key)) {
        return false
      }
      if (disabledHeaders && disabledHeaders[key] === true) {
        return false
      }
      return true
    }),
  )
}

/**
 * Drops default header entries that are disabled for this example via
 * `operation['x-scalar-disable-parameters']['default-headers'][exampleName]`.
 *
 * Context builders keep the full default header map for the UI; call this when merging into the
 * outbound request (for example in `requestFactory`).
 */
export const filterDisabledDefaultHeaders = (
  operation: OperationObject,
  exampleName: string,
  headers: Record<string, string>,
): Record<string, string> =>
  filterDefaultHeadersByVisibility(operation, exampleName, headers, {
    hideOverriddenHeaders: false,
    hideDisabledHeaders: true,
  })

/**
 * Generates default headers for an OpenAPI operation and HTTP method.
 *
 * This function adds standard HTTP headers based on the request context:
 * - Content-Type: Added only if the HTTP method supports a request body and the OpenAPI operation
 *   defines a request body content type. Uses the selected content type from the operation or the
 *   first defined request body content type. Omitted when the selection is `none` or `other`.
 * - Accept: Derived from the 2xx response content types in the spec (joined as a comma-separated list), falling back to a wildcard.
 * - User-Agent: Added in Electron environments (desktop app or proxy) to identify the client.
 *
 * @param hideDisabledHeaders If true, filters out headers marked as disabled for this example via
 *   `x-scalar-disable-parameters.default-headers`.
 * @param hideOverriddenHeaders If true, omits any default header whose name matches an **enabled**
 *   operation parameter with `in: header` (disabled optional header parameters do not shadow defaults).
 */
export const getDefaultHeaders = ({
  method,
  operation,
  exampleName,
  hideDisabledHeaders = false,
  hideOverriddenHeaders = false,
  options = {
    isElectron: false,
    appVersion: '0.0.0',
  },
}: {
  method: HttpMethod
  operation: OperationObject
  exampleName: string
  hideDisabledHeaders?: boolean
  hideOverriddenHeaders?: boolean
  options?: {
    appVersion: string
    isElectron: boolean
  }
}): Record<string, string> => {
  const headers = new Headers()
  const requestBody = getResolvedRef(operation.requestBody)

  // Add Content-Type header only for methods that support a request body
  if (canMethodHaveBody(method) && requestBody) {
    const contentType =
      requestBody['x-scalar-selected-content-type']?.[exampleName] ?? Object.keys(requestBody.content ?? {})[0]

    // We never want to add a content type of 'none' or invent one when the schema defines no body.
    // 'other' is a UI-only choice for a raw body without an auto-added Content-Type header.
    if (contentType && contentType !== 'none' && contentType !== 'other') {
      headers.set('Content-Type', contentType)
    }
  }

  // Derive Accept from the 2xx response content types so the server can pick the best match.
  const successResponseKey = Object.keys(operation.responses ?? {}).find((k) => k.startsWith('2'))
  const successResponse = successResponseKey ? getResolvedRef(operation.responses![successResponseKey]) : null
  const acceptValue = Object.keys(successResponse?.content ?? {}).join(', ') || DEFAULT_ACCEPT

  headers.set('Accept', acceptValue)

  // Add User-Agent in Electron environments for client identification
  if (options.isElectron && options.appVersion) {
    headers.set('User-Agent', `Scalar/${options.appVersion}`)
  }

  const result = Object.fromEntries(headers.entries())

  if (hideOverriddenHeaders || hideDisabledHeaders) {
    // return a new object with the filtered headers
    return filterDefaultHeadersByVisibility(operation, exampleName, result, {
      hideOverriddenHeaders,
      hideDisabledHeaders,
    })
  }

  return result
}
