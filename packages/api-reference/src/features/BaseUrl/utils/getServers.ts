/**
 * TODO: This does a lot of normalization of the provided servers.
 * We want to move this code over to @scalar/api-client and just tap into the api client workspace eventually, though.
 */
import { concatenateUrlAndPath, findVariables } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'

export type DefaultServerUrlOption = {
  /**
   * Sometimes you can’t add an URL to your OpenAPI document, so you can provide a default one here.
   */
  defaultServerUrl?: string
}

/**
 * Provide a specification and get the servers from it.
 * If no servers are found, it will default to a specified URL or the current URL.
 * Relative paths will be prepended with the default server URL or the current URL.
 */
export function getServers(
  specification: Spec | undefined,
  options?: DefaultServerUrlOption,
) {
  let servers: (OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject)[] = []

  // Overwrite with servers from the specification
  if (specification?.servers && specification?.servers.length > 0) {
    servers = specification.servers
  }
  // Use Swagger 2.0 host and basePath
  else if (specification?.host) {
    // Use the first scheme if available, otherwise default to http
    const scheme = specification.schemes?.[0] ?? 'http'

    servers = [
      {
        url: `${scheme}://${specification.host}${specification?.basePath ?? ''}`,
      },
    ]
  }
  // Fallback to `defaultServerUrl` or current URL
  else {
    servers = [
      {
        url: options?.defaultServerUrl
          ? options?.defaultServerUrl
          : typeof window !== 'undefined'
            ? window.location.origin
            : '/',
      },
    ]
  }

  // Prepend relative paths (if we can)
  if (options?.defaultServerUrl || typeof window !== 'undefined') {
    servers = servers.map((server) => prependRelativePaths(server, options))
  }

  // Variables
  return servers.map((server) => {
    // Existing variables
    const variables = server.variables ?? {}

    // Find variables in URL
    const variablesInUrl = findVariables(server.url ?? '')

    // Update the variables object
    variablesInUrl
      // Ignore existing variables
      .filter((variable: string) => !variables[variable])
      // Add new variables
      .forEach((variable: string) => {
        if (server.variables === undefined) {
          server.variables = {}
        }

        server.variables[variable] = {
          default: '',
        }
      })

    return server
  })
}

/**
 * Prepend relative paths with the default server URL or the current URL.
 *
 * Example: /foobar -> http://localhost/foobar
 */
function prependRelativePaths(
  server: OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject,
  options?: DefaultServerUrlOption,
) {
  // URLs that start with http[s]:// or a variable
  if (!server.url?.match(/^(?!(https?|file):\/\/|{).+/)) {
    return server
  }

  server.url = concatenateUrlAndPath(
    options?.defaultServerUrl
      ? options?.defaultServerUrl
      : typeof window !== 'undefined'
        ? window.location.origin
        : '',
    server.url,
  )

  return server
}
