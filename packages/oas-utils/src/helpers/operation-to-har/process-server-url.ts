import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Processes a server URL by replacing variables with their default values and merging with the path
 */
export const processServerUrl = (server: ServerObject, path: string): string => {
  if (!server.url) {
    return path
  }
  const serverUrl = server.url

  // Replace server variables with their default values
  if (server.variables) {
    const variables = Object.entries(server.variables)

    // Extract default values from server variables
    const defaultValues = variables.reduce(
      (defaults, [variableName, variableConfig]) => {
        if (variableConfig.default !== undefined) {
          defaults[variableName] = variableConfig.default
        }
        return defaults
      },
      {} as Record<string, string | number>,
    )

    // Replace variables in the server URL with their default values
    const serverUrlWithVars = replaceVariables(serverUrl, defaultValues)

    return mergeUrls(serverUrlWithVars, path)
  }

  return mergeUrls(serverUrl, path)
}
