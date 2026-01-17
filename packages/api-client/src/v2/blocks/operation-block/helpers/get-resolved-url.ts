import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import { getEnvironmentVariables } from '@/v2/blocks/operation-block/helpers/get-environment-variables'
import { getServerUrl } from '@/v2/blocks/operation-block/helpers/get-server-url'

/**
 * Resolves and constructs the final request URL using the provided environment, server, path,
 * path variables, and optional query parameters.
 *
 * - Environment variables and path variables are used to replace placeholders in the path string.
 * - The server URL is dynamically resolved (may apply env variables).
 * - urlParams are optionally appended as the query string.
 *
 * @param environment    The current environment containing variable values.
 * @param server         The selected server object; can be null.
 * @param path           The raw path string from the OpenAPI document (may contain variables).
 * @param pathVariables  Map of path variable values (e.g., { petId: '5' }).
 * @param urlParams      Optional query parameters as URLSearchParams.
 * @returns              Fully resolved URL as a string.
 */
export const getResolvedUrl = ({
  environment,
  server,
  path,
  pathVariables,
  urlParams,
}: {
  environment: XScalarEnvironment
  server: ServerObject | null
  path: string
  pathVariables: Record<string, string>
  urlParams?: URLSearchParams
}) => {
  const environmentVariables = getEnvironmentVariables(environment)
  const serverUrl = getServerUrl(server, environmentVariables)
  const pathWithVariables = replaceVariables(path, { ...environmentVariables, ...pathVariables })
  return mergeUrls(serverUrl, pathWithVariables, urlParams)
}
