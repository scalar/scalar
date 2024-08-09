import type { Server as ApiClientServer } from '#legacy'
import type { Server } from '@/features/BaseUrl'
import type { Spec } from '@scalar/oas-utils'
import { type Ref, reactive, watch } from 'vue'

import { getServers } from '../../features/BaseUrl/utils'
import { createEmptySpecification } from '../../helpers'
import type { ServerState } from '../types'

export const createEmptyServerState = (): ServerState => ({
  selectedServer: null,
  servers: [],
  variables: {},
})

const server = reactive<ServerState>(createEmptyServerState())

const setServer = (newState: Partial<ServerState>) => {
  Object.assign(server, {
    ...server,
    ...newState,
  })
}

/**
 * Get the default values for the server variables
 */
function getDefaultValuesFromServers(variables: ApiClientServer['variables']) {
  return Object.fromEntries(
    Object.entries(variables ?? {}).map(([name, variable]) => [
      name,
      // 1) Default
      variable.default?.toString() ??
        // 2) First enum value
        variable.enum?.[0]?.toString() ??
        // 3) Empty string
        '',
    ]),
  )
}

/**
 * Remove variables that are not present in the servers list
 */
function removeNotExistingVariables(
  variables: Record<string, string>,
  thisServer: ApiClientServer,
) {
  return Object.fromEntries(
    Object.entries(variables).filter(
      ([name]) => name in (thisServer.variables ?? {}),
    ),
  )
}

export const useServerStore = ({
  specification,
  defaultServerUrl,
  servers,
}: {
  specification?: Ref<Spec>
  /**
   * The fallback server URL to use if no servers are found in the specification
   */
  defaultServerUrl?: Ref<string | undefined>
  /**
   * Overwrite the list of servers
   */
  servers?: Ref<Server[] | undefined>
} = {}) => {
  if (specification?.value !== undefined) {
    // Watch the spec and set the servers
    watch(
      () => [specification?.value, servers, defaultServerUrl],
      () => {
        const normalizedSpecification =
          // Use the specification
          servers?.value === undefined
            ? specification?.value ?? createEmptySpecification()
            : // Or create an empty one with the specified servers list
              createEmptySpecification({
                servers,
              })

        const result = getServers(normalizedSpecification, {
          defaultServerUrl: defaultServerUrl?.value,
        }) as ApiClientServer[]

        setServer({
          servers: result,
          variables: {
            // Set the initial values for the variables
            ...getDefaultValuesFromServers(
              result?.[server.selectedServer ?? 0]?.variables ?? {},
            ),
            // Don’t overwrite existing values, but filter out non-existing variables
            ...removeNotExistingVariables(
              server.variables,
              result?.[server.selectedServer ?? 0] ?? {},
            ),
          },
        })
      },
      { deep: true, immediate: true },
    )
  }

  return {
    server,
    setServer,
  }
}
