import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import { type Ref, reactive, watch } from 'vue'

import { getServers } from '../../features/BaseUrl/utils/getServers'
import { createEmptySpecification } from '../../helpers/createEmptySpecification'

export type ServerState = {
  selectedServer: null | number
  description?: string
  servers?: (OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject)[]
  variables: { [key: string]: string }
}

export const createEmptyServerState = (): ServerState => ({
  selectedServer: null,
  servers: [],
  variables: {},
})

const serverStore = reactive<ServerState>(createEmptyServerState())

const setServer = (newState: Partial<ServerState>) => {
  Object.assign(serverStore, {
    ...serverStore,
    ...newState,
  })
}

/**
 * Get the default values for the server variables
 */
function getDefaultValuesFromServers(
  variables:
    | OpenAPIV3.ServerObject['variables']
    | OpenAPIV3_1.ServerObject['variables'],
) {
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
  thisServer: OpenAPIV3_1.ServerObject | OpenAPIV3.ServerObject,
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
  specification?: Ref<Spec | undefined>
  /**
   * The fallback server URL to use if no servers are found in the specification
   */
  defaultServerUrl?: Ref<string | undefined>
  /**
   * Overwrite the list of servers
   */
  servers?: Ref<
    (OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject)[] | undefined
  >
} = {}) => {
  if (specification?.value !== undefined) {
    // Watch for changes in the OpenAPI document or the configuration and update the server state
    watch(
      () => [specification?.value, servers?.value, defaultServerUrl?.value],
      () => {
        // Make sure to have an OpenAPI document, even if it’s just build from the servers list
        const normalizedSpecification =
          // Use the specification
          servers?.value === undefined
            ? specification?.value ?? createEmptySpecification()
            : // Or create an empty one with the specified servers list
              createEmptySpecification({
                servers: servers.value,
              })

        /** List of servers */
        const result = getServers(normalizedSpecification, {
          defaultServerUrl: defaultServerUrl?.value,
        })

        /** Selected server entry */
        const currentServer = result?.[serverStore.selectedServer ?? 0]

        // Update the server state
        setServer({
          servers: result,
          variables: {
            // Set the initial values for the variables
            ...getDefaultValuesFromServers(currentServer?.variables ?? {}),
            // Don’t overwrite existing values, but filter out non-existing variables
            ...removeNotExistingVariables(
              serverStore.variables,
              result?.[serverStore.selectedServer ?? 0] ?? {},
            ),
          },
        })
      },
      {
        deep: true,
        immediate: true,
      },
    )
  }

  return {
    server: serverStore,
    setServer,
  }
}
