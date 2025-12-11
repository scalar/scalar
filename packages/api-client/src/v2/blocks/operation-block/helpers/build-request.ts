import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OpenApiDocument, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { isElectron } from '@/libs/electron'
import type { ErrorResponse } from '@/libs/errors'
import type { PluginManager } from '@/plugins/plugin-manager'
import { buildRequestBody } from '@/v2/blocks/operation-block/helpers/build-request-body'
import { buildRequestParameters } from '@/v2/blocks/operation-block/helpers/build-request-parameters'
import { buildRequestSecurity } from '@/v2/blocks/operation-block/helpers/build-request-security'

/**
 * Build the fetch request object which can then be executed
 *
 * @returns A request object and a controller to cancel the request
 */
export const buildRequest = ({
  cookies,
  environment,
  exampleKey = 'default',
  method,
  operation,
  path,
  securitySchemes,
  selectedSecurity,
}: {
  /** Workspace/document cookies */
  cookies: XScalarCookie[]
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
  /** The key of the current example */
  exampleKey: string
  /** The HTTP method of the operation */
  method: HttpMethod
  /** The operation object */
  operation: OperationObject
  /** The path of the operation */
  path: string
  /** The proxy URL for cookie domain determination */
  proxyUrl: string | undefined
  /** Document defined security schemes */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected security for the current operation */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** The server object */
  server: ServerObject | null
}): ErrorResponse<{
  controller: AbortController
  request: Request
}> => {
  try {
    /** Flatten the environment variables array into a key-value object */
    const env = environment.variables.reduce(
      (acc, curr) => {
        acc[curr.name] = typeof curr.value === 'string' ? curr.value : curr.value.default
        return acc
      },
      {} as Record<string, string>,
    )

    const requestBody = getResolvedRef(operation.requestBody)

    /** Resolve the selected content type from the request body */
    const contentType =
      requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
      Object.keys(requestBody?.content ?? {})[0] ??
      'application/json'

    /** Build out the request parameters */
    const params = buildRequestParameters(operation.parameters ?? [], {
      env,
      exampleKey,
      contentType,
      serverUrl: server?.url,
      proxyUrl,
    })
    const body = buildRequestBody(requestBody, exampleKey, contentType)
    const security = buildRequestSecurity(securitySchemes, selectedSecurity, env)

    // Combine the headers, cookies and url params
    const headers = { ...params.headers, ...security.headers }
    const unprocessedCookies = [...cookies, ...params.cookies, ...security.cookies]
    const urlParams = new URLSearchParams([...params.urlParams, ...security.urlParams])

    const serverReplaced = replaceVariables(server?.url ?? '', { ...env, ...server?.variables })
    const pathReplaced = replaceVariables(path, { ...env, ...params.pathVariables })

    // If we are running in Electron, we need to add a custom header
    // that's then forwarded as a `User-Agent` header.
    if (isElectron() && headers['user-agent']) {
      headers['X-Scalar-User-Agent'] = headers['user-agent']
    }

    // Global cookies
    // Normalize auth headers
    // normalize headers
    // normalize cookies
    // Server variables
    // Cookie header
    // Auth
    // Plugin manager

    const request = new Request(path, {
      method,
      headers,
      body,
      cookies,
      urlParams,
    })

    return [
      null,
      {
        request,
        controller: new AbortController(),
      },
    ]
  } catch (error) {
    return [normalizeError(error), null]
  }
}
