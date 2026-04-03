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
  options: { envVariables: Record<string, string> },
): string => {
  const variables = options.envVariables
  const securityQueryParams = new URLSearchParams()

  request.security.forEach((security) => {
    const name = replaceEnvVariables(security.name, variables)
    const securityValue = replaceEnvVariables(security.value, variables)

    if (security.in === 'query') {
      securityQueryParams.set(name, securityValue)
    }
  })

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

  for (const [key, value] of securityQueryParams.entries()) {
    url.searchParams.set(replaceEnvVariables(key, variables), replaceEnvVariables(value, variables))
  }

  for (const [key, value] of request.query.params.entries()) {
    url.searchParams.set(replaceEnvVariables(key, variables), replaceEnvVariables(value, variables))
  }

  return url.toString()
}
