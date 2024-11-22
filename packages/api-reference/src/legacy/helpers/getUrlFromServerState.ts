import type { ServerState } from '#legacy'
import { REGEX, replaceVariables } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/types'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(
  state: ServerState,
  server?: OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject,
) {
  // Use the provided server or fallback to the selected server in the state
  const selectedServer = server ?? state?.servers?.[state.selectedServer ?? 0]

  // Get the selected server and remove trailing slash
  if (selectedServer?.url?.endsWith('/')) {
    selectedServer.url = selectedServer.url.slice(0, -1)
  }

  // Store the original URL before any modifications
  const originalUrl = selectedServer?.url

  // Replace variables: {protocol}://{host}:{port}/{basePath}
  const url =
    typeof selectedServer?.url === 'string'
      ? replaceVariables(selectedServer?.url, state.variables)
      : selectedServer?.url

  // {id} -> __ID__
  const urlVariables = url?.match(REGEX.PATH)

  const modifiedUrl =
    urlVariables?.reduce((acc, variable) => {
      const variableName = variable.replace(/{|}/g, '')
      const variableValue = state.variables?.[variableName]
      return acc?.replace(
        variable,
        variableValue ? variableValue : `__${variableName.toUpperCase()}__`,
      )
    }, url) ?? url

  // Return original and modified URLs to handle reference and client updates
  return { originalUrl, modifiedUrl }
}
