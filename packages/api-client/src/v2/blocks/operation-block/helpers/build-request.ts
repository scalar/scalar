import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import { redirectToProxy, shouldUseProxy } from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { SecuritySchemeObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { objectEntries } from '@vueuse/core'

import { isElectron } from '@/libs/electron'
import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'

import { buildRequestBody } from './build-request-body'
import { buildRequestCookieHeader } from './build-request-cookie-header'
import { buildRequestParameters } from './build-request-parameters'
import { buildRequestSecurity } from './build-request-security'

/**
 * Builds a fully configured Request object ready for execution.
 *
 * This function processes an OpenAPI operation and constructs a fetch-compatible
 * Request by resolving environment variables, applying security schemes, building
 * headers and cookies, handling proxy redirection, and preparing the request body.
 *
 * The function handles special cases like Electron environments and proxy usage
 * where custom cookie headers are required.
 *
 * @returns A tuple containing either an error or the request object with an abort controller
 */
export const buildRequest = ({
  environment,
  exampleKey = 'default',
  globalCookies,
  method,
  operation,
  path,
  proxyUrl,
  server,
  selectedSecuritySchemes,
}: {
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
  /** The key of the current example */
  exampleKey: string
  /** Workspace + document cookies */
  globalCookies: XScalarCookie[]
  /** The HTTP method of the operation */
  method: HttpMethod
  /** The operation object */
  operation: OperationObject
  /** The path of the operation */
  path: string
  /** The proxy URL for cookie domain determination */
  proxyUrl: string
  /** The server object */
  server: ServerObject | null
  /** The selected security schemes for the current operation */
  selectedSecuritySchemes: SecuritySchemeObject[]
}): ErrorResponse<{
  controller: AbortController
  request: Request
  isUsingProxy: boolean
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

    /** Extract the server variables default values*/
    const serverVariables = objectEntries(server?.variables ?? {}).reduce(
      (acc, [name, variable]) => {
        if (variable.default) {
          acc[name] = variable.default
        }
        return acc
      },
      {} as Record<string, string>,
    )

    const serverUrl = replaceVariables(server?.url ?? '', { ...env, ...serverVariables })
    const requestBody = getResolvedRef(operation.requestBody)

    // Throw for no server or path
    if (!serverUrl && !path) {
      throw ERRORS.URL_EMPTY
    }

    /** Build out the request parameters */
    const params = buildRequestParameters(operation.parameters ?? [], env, exampleKey)
    const body = buildRequestBody(requestBody, env, exampleKey)
    const security = buildRequestSecurity(selectedSecuritySchemes, env)

    // Combine the headers, cookies and url params
    const headers = { ...params.headers, ...security.headers }
    const urlParams = new URLSearchParams([...params.urlParams, ...security.urlParams])
    const processedPath = replaceVariables(path, { ...env, ...params.pathVariables })

    /** Combine the server url, path and url params into a single url */
    const url = mergeUrls(serverUrl, processedPath, urlParams)
    const isUsingProxy = shouldUseProxy(proxyUrl, url)
    const proxiedUrl = redirectToProxy(proxyUrl, url)

    // If we are running in Electron, we need to add a custom header
    // that's then forwarded as a `User-Agent` header.
    const userAgentHeader = headers['User-Agent'] || headers['user-agent']
    if (isElectron() && userAgentHeader) {
      headers['X-Scalar-User-Agent'] = userAgentHeader
    }

    /** Build out the cookies header */
    const cookiesHeader = buildRequestCookieHeader({
      paramCookies: [...params.cookies, ...security.cookies],
      globalCookies,
      env,
      path: processedPath,
      originalCookieHeader: headers['Cookie'] || headers['cookie'],
      url: serverUrl || path,
      useCustomCookieHeader: isElectron() || isUsingProxy,
    })
    if (cookiesHeader) {
      headers[cookiesHeader.name] = cookiesHeader.value
    }

    /** Controller to allow aborting the request */
    const controller = new AbortController()

    /** Build the js request object */
    const request = new Request(proxiedUrl, {
      /**
       * Ensure that patch is uppercase
       *
       * @see https://github.com/JakeChampion/fetch/issues/254
       */
      method: method === 'patch' ? method.toUpperCase() : method,
      headers,
      signal: controller.signal,
      body,
    })

    return [
      null,
      {
        controller,
        isUsingProxy,
        request,
      },
    ]
  } catch (error) {
    return [normalizeError(error, ERRORS.BUILDING_REQUEST_FAILED), null]
  }
}
