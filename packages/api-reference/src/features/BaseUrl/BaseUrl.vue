<script lang="ts" setup>
import {
  type Server as ApiClientServer,
  useServerStore,
} from '@scalar/api-client'
import type { Spec } from '@scalar/oas-utils'
import { ref, watch } from 'vue'

import ServerForm from './ServerForm.vue'
import type { Server } from './types'
import { getServers } from './utils'

const props = defineProps<{
  /**
   * The specification to get the servers from
   */
  specification?: Spec
  /**
   * The fallback server URL to use if no servers are found in the specification
   */
  defaultServerUrl?: string
}>()

const { server: serverState, setServer } = useServerStore()

// Keep the selected item in sync with the store
const selected = ref<number>(0)

watch(
  selected,
  () =>
    setServer({
      selectedServer: selected.value,
    }),
  {
    immediate: true,
  },
)

// Watch the spec and set the servers
watch(
  () => props.specification,
  () => {
    const servers = getServers(props.specification, {
      defaultServerUrl: props.defaultServerUrl,
    }) as ApiClientServer[]

    setServer({
      servers,
      variables: {
        // Set the initial values for the variables
        ...getDefaultValuesFromServers(
          servers[selected.value]?.variables ?? {},
        ),
        // Don’t overwrite existing values, but filter out non-existing variables
        ...removeNotExistingVariables(
          serverState.variables,
          servers[selected.value],
        ),
      },
    })
  },
  { deep: true, immediate: true },
)

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
  server: ApiClientServer,
) {
  return Object.fromEntries(
    Object.entries(variables).filter(
      ([name]) => name in (server.variables ?? {}),
    ),
  )
}

function onUpdateVariable(name: string, value: string) {
  setServer({
    variables: {
      ...serverState.variables,
      [name]: value,
    },
  })
}
</script>
<template>
  <ServerForm
    :selected="selected"
    :servers="serverState.servers as Server[]"
    :variables="serverState.variables"
    @update:selected="
      (value) => {
        selected = value
      }
    "
    @update:variable="onUpdateVariable" />
</template>
