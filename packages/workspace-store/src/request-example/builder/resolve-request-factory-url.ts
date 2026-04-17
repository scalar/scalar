import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeSearchParams, mergeUrls } from '@scalar/helpers/url/merge-urls'

import type { RequestFactory } from '@/request-example/builder/request-factory'

/**
 * Resolves the request URL string from a {@link RequestFactory} using the same
 * rules as {@link buildRequest} (path variables, query, security query params),
 * without proxy rewriting or reserved-query encoding.
 */
export const resolveRequestFactoryUrl = (
  request: RequestFactory,
  options: {
    envVariables: Record<string, string> | ((value: string) => string | null)
    securityQueryParams: URLSearchParams
  },
): string => {
  const variables = options.envVariables

  const pathVariables = Object.fromEntries(
    Object.entries(request.path.variables).map(([key, value]) => [
      key,
      encodeURIComponent(replaceEnvVariables(value, variables)),
    ]),
  )

  const baseUrl = replaceEnvVariables(request.baseUrl, variables)
  const path = replacePathVariables(request.path.raw, pathVariables)
  const mergedUrl = mergeUrls(baseUrl, path)
  // When rendered inside an iframe with srcdoc, the browser reports
  // window.location.origin as the string "null" instead of a real origin.
  // Fall back to localhost so relative URLs can still be resolved.
  const origin = globalThis.window?.location?.origin
  const urlBase = origin && origin !== 'null' ? origin : 'http://localhost:3000'
  const url = new URL(mergedUrl, urlBase)

  const operationQueryParams = new URLSearchParams()
  for (const [key, value] of request.query.entries()) {
    operationQueryParams.append(replaceEnvVariables(key, variables), replaceEnvVariables(value, variables))
  }

  const securityQueryParams = new URLSearchParams()
  for (const [key, value] of options.securityQueryParams.entries()) {
    securityQueryParams.append(key, value)
  }

  url.search = mergeSearchParams(url.searchParams, operationQueryParams, securityQueryParams).toString()

  return url.toString()
}
