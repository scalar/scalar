import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { type Result, err, ok } from '@scalar/helpers/types/result'
import { safeRun } from '@scalar/helpers/types/safe-run'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { mergeSearchParams, mergeUrls } from '@scalar/helpers/url/merge-urls'

import type { RequestFactory } from '@/request-example/builder/request-factory'

/**
 * Discriminated error code when the merged request URL is not a complete absolute target
 * (for example no OpenAPI server, or unresolved `{{environment}}` segments left in the merged URL).
 */
export const MISSING_REQUEST_SERVER_BASE = 'MISSING_REQUEST_SERVER_BASE' as const

/**
 * Discriminated error code when the merged URL cannot be encoded or parsed (invalid path params, malformed URL).
 */
export const INVALID_REQUEST_FACTORY_URL = 'INVALID_REQUEST_FACTORY_URL' as const

export type ResolveRequestFactoryUrlError = typeof MISSING_REQUEST_SERVER_BASE | typeof INVALID_REQUEST_FACTORY_URL

export type ResolveRequestFactoryUrlResult = Result<string, ResolveRequestFactoryUrlError>

const INCOMPLETE_MERGED_URL_MESSAGE =
  'No server URL is configured for this request. Add a servers entry to your OpenAPI document (or set a server in the client) before sending.'

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
    /**
     * When true, skips incomplete-URL validation (embedded modal, copy URL, tests).
     * @default false
     */
    allowMissingRequestServerBase?: boolean
  },
): ResolveRequestFactoryUrlResult => {
  const variables = options.envVariables

  const pathVariablesEncoded = safeRun(() =>
    Object.fromEntries(
      Object.entries(request.path.variables).map(([key, value]) => [
        key,
        encodeURIComponent(replaceEnvVariables(value, variables)),
      ]),
    ),
  )
  if (!pathVariablesEncoded.ok) {
    return err(INVALID_REQUEST_FACTORY_URL, 'The request URL contains invalid characters in path parameters.')
  }
  const pathVariables = pathVariablesEncoded.data

  const baseUrl = replaceEnvVariables(request.baseUrl, variables)
  const rawPath = replaceEnvVariables(request.path.raw, variables)
  const path = replacePathVariables(rawPath, pathVariables)
  const mergedUrl = mergeUrls(baseUrl, path)

  if (!options.allowMissingRequestServerBase && isRelativePath(mergedUrl)) {
    return err(MISSING_REQUEST_SERVER_BASE, INCOMPLETE_MERGED_URL_MESSAGE)
  }

  // When rendered inside an iframe with srcdoc, the browser reports
  // window.location.origin as the string "null" instead of a real origin.
  // Fall back to localhost so relative URLs can still be resolved.
  const origin = globalThis.window?.location?.origin
  const urlBase = origin && origin !== 'null' ? origin : 'http://localhost:3000'
  // Fallback for modal layout without a base server url (it should use the current origin)
  const urlParsed = safeRun(() => new URL(mergedUrl, urlBase))
  if (!urlParsed.ok) {
    return err(
      INVALID_REQUEST_FACTORY_URL,
      'The request URL could not be parsed. Check the server URL and path for invalid characters.',
    )
  }
  const url = urlParsed.data

  const operationQueryParams = new URLSearchParams()
  for (const [key, value] of request.query.entries()) {
    operationQueryParams.append(replaceEnvVariables(key, variables), replaceEnvVariables(value, variables))
  }

  const securityQueryParams = new URLSearchParams()
  for (const [key, value] of options.securityQueryParams.entries()) {
    securityQueryParams.append(key, value)
  }

  url.search = mergeSearchParams(url.searchParams, operationQueryParams, securityQueryParams).toString()

  return ok(url.toString())
}
