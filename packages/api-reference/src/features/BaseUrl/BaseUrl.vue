<script lang="ts" setup>
import { useServerStore } from '#legacy'
import type { Server, Spec } from '@scalar/types/legacy'
import { ref, toRef, watch } from 'vue'

import ServerForm from './ServerForm.vue'

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
