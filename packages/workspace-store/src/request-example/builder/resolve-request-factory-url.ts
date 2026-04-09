import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'

import type { RequestFactory } from '@/request-example/builder/request-factory'

/**
 * Resolves the request URL string from a {@link RequestFactory} using the same
 * rules as {@link buildRequest} (path variables, query, security query params),
 * without proxy rewriting or reserved-query encoding.
 */
export const resolveRequestFactoryUrl = (
  request: RequestFactory,
  options: { envVariables: Record<string, string>; securityQueryParams: URLSearchParams },
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
  const urlBase = globalThis.window?.location?.origin ?? 'http://localhost:3000'
  const url = new URL(mergedUrl, urlBase)

  // Merge in operation query params
  for (const [key, value] of request.query.entries()) {
    url.searchParams.set(replaceEnvVariables(key, variables), replaceEnvVariables(value, variables))
  }

  // Merge in security query params
  for (const [key, value] of options.securityQueryParams.entries()) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}
