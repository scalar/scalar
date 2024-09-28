<script lang="ts" setup>
import { useServerStore } from '#legacy'
import type { Server, Spec } from '@scalar/types/legacy'
import { computed, toRef } from 'vue'

import ServerForm from './ServerForm.vue'
import type { ServerVariableValues } from './types'

const props = defineProps<{
  /**
   * The specification to get the servers from
   */
  specification?: Spec
  /**
   * The fallback server URL to use if no servers are found in the specification
   */
  defaultServerUrl?: string
  /**
   * Overwrite the list of servers
   */
  servers?: Server[]
}>()

const specification = toRef(props.specification)
const defaultServerUrl = toRef(props.defaultServerUrl)
const servers = toRef(props.servers)

const { server: serverState, setServer } = useServerStore({
  specification,
  defaultServerUrl,
  servers,
})

const selected = computed<number>({
  get: () => serverState.selectedServer || 0,
  set: (i) => setServer({ selectedServer: i }),
})

const variables = computed<ServerVariableValues>({
  get: () => serverState.variables,
  set: (v) => setServer({ variables: v }),
})
</script>
<template>
  <ServerForm
    v-model:selected="selected"
    v-model:variables="variables"
    :servers="serverState.servers as Server[]" />
</template>
