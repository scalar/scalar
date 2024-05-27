import type { ServerState } from '../types'
import { replaceVariables } from './replaceVariables'

/**
 * Get the URL from the server state.
 */
export function getUrlFromServerState(state: ServerState) {
  // Get the selected server
  const server = state?.servers?.[state.selectedServer ?? 0]

  // Make variables an key value object
  const variables = state.variables.reduce(
    (acc, variable) => {
      acc[variable.name] = variable.value
      return acc
    },
    {} as Record<string, string | number>,
  )

  // Replace variables: {protocol}://{host}:{port}/{basePath}
  const url =
    typeof server?.url === 'string'
      ? replaceVariables(server?.url, variables)
      : server?.url

  return url
}
