<script lang="ts" setup>
import {
  type Server as ApiClientServer,
  useServerStore,
} from '@scalar/api-client'
import type { Spec } from '@scalar/oas-utils'
import { ref, watch } from 'vue'

import ServerForm from './ServerForm.vue'
import type { Server, ServerVariables } from './types'
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

// Watch the spec and set the servers
watch(
  () => props.specification,
  () =>
    setServer({
      servers: getServers(props.specification, {
        defaultServerUrl: props.defaultServerUrl,
      }) as ApiClientServer[],
    }),
  { deep: true, immediate: true },
)

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
  <div></div>
  <ServerForm
    :selected="selected"
    :servers="serverState.servers as Server[]"
    :variables="serverState.variables"
    @update:selected="(value) => (selected = value)"
    @update:variable="onUpdateVariable" />
</template>
