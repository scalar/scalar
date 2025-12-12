import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import { redirectToProxy, shouldUseProxy } from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OpenApiDocument, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { objectEntries } from '@vueuse/core'

import { isElectron } from '@/libs/electron'
import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import { buildRequestBody } from '@/v2/blocks/operation-block/helpers/build-request-body'
import { buildRequestCookieHeader } from '@/v2/blocks/operation-block/helpers/build-request-cookie-header'
import { buildRequestParameters } from '@/v2/blocks/operation-block/helpers/build-request-parameters'
import { buildRequestSecurity } from '@/v2/blocks/operation-block/helpers/build-request-security'

/**
 * Build the fetch request object which can then be executed
 *
 * @returns A request object and a controller to cancel the request
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
  securitySchemes,
  selectedSecurity,
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

    /** Resolve the selected content type from the request body */
    const contentType =
      requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
      Object.keys(requestBody?.content ?? {})[0] ??
      'application/json'

    /** Build out the request parameters */
    const params = buildRequestParameters(operation.parameters ?? [], env, exampleKey, contentType)
    const body = buildRequestBody(requestBody, exampleKey, contentType)
    const security = buildRequestSecurity(securitySchemes, selectedSecurity, env)

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
    if (isElectron() && headers['user-agent']) {
      headers['X-Scalar-User-Agent'] = headers['user-agent']
    }

    /** Build out the cookies header */
    const cookiesHeader = buildRequestCookieHeader({
      paramCookies: [...params.cookies, ...security.cookies],
      globalCookies,
      env,
      originalCookieHeader: headers['Cookie'] || headers['cookie'],
      domainUrl: serverUrl || path,
      useCustomCookieHeader: isElectron() || isUsingProxy,
    })
    if (cookiesHeader) {
      headers[cookiesHeader.name] = cookiesHeader.value
    }

    /** Controller to allow aborting the request */
    const controller = new AbortController()

    /** Build the js request object */
    const request = new Request(proxiedUrl, {
      method,
      headers,
      signal: controller.signal,
      body,
    })

    return [
      null,
      {
        request,
        controller,
      },
    ]
  } catch (error) {
    return [normalizeError(error), null]
  }
}
