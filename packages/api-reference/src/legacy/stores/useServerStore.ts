import { getServers } from '#legacy'
import type { Spec } from '@scalar/oas-utils'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { type Ref, reactive, watch } from 'vue'

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
                servers: servers.value,
              })

        const result = getServers(normalizedSpecification, {
          defaultServerUrl: defaultServerUrl?.value,
        })

        const currentServer = result?.[serverStore.selectedServer ?? 0]

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
      { deep: true, immediate: true },
    )
  }

  return {
    server: serverStore,
    setServer,
  }
}
