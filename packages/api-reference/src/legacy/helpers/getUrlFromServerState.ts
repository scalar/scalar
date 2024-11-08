import type { ServerState } from '#legacy'
import { REGEX, replaceVariables } from '@scalar/oas-utils/helpers'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(state: ServerState) {
  // Get the selected server and remove trailing slash
  const server = state?.servers?.[state.selectedServer ?? 0]

  if (server?.url?.endsWith('/')) {
    server.url = server.url.slice(0, -1)
  }

  // Replace variables: {protocol}://{host}:{port}/{basePath}
  const url =
    typeof server?.url === 'string'
      ? replaceVariables(server?.url, state.variables)
      : server?.url

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

  return modifiedUrl
}
