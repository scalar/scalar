<script lang="ts">
export type SelectorProps = {
  /** The selected server URL */
  xSelectedServer?: string
  /** Available servers */
  servers: ServerObject[]
}

/**
 * ServerSelector
 *
 * Core component for rendering a server selector block.
 * Handles server selection and emits a 'scalar-update-selected-server' event when the selected server changes.
 *
 * @event scalar-update-selected-server - Emitted when the selected server changes
 */
export default {}
</script>

<script lang="ts" setup>
import { ServerVariablesForm } from '@scalar/api-client/components/Server'
import { ScalarMarkdown } from '@scalar/components'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { computed, ref, useId, watch } from 'vue'

import { emitCustomEvent } from '@/v2/events'

import Selector from './Selector.vue'

const id = useId()

/** Reference to the main container element for event emission */
const containerRef = ref<HTMLElement>()

const { servers, xSelectedServer } = defineProps<SelectorProps>()

const updateServer = (newServer: string) => {
  if (!containerRef.value) {
    return
  }

  emitCustomEvent(
    containerRef.value,
    'scalar-update-selected-server',
    newServer,
  )
}

const updateServerVariable = (key: string, value: string) => {
  if (!containerRef.value) {
    return
  }

  emitCustomEvent(
    containerRef.value,
    'scalar-update-selected-server-variables',
    { key, value },
  )
}

const server = computed(() => {
  return servers.find((s) => s.url === xSelectedServer)
})

// Automatically select the first server if none is currently selected
watch(
  () => servers,
  (newServers) => {
    if (!newServers.length) {
      return
    }

    if (xSelectedServer) {
      return
    }

    updateServer(newServers[0].url)
  },
  { immediate: true },
)
</script>

<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-lg border border-b-0 px-3 py-2.5 font-medium">
    Server
  </label>
  <div
    ref="containerRef"
    :id="id"
    class="border"
    :class="{
      'rounded-b-lg': !server?.description && !server?.variables,
    }">
    <Selector
      v-if="servers.length"
      :servers="servers"
      :xSelectedServer="xSelectedServer"
      :target="id"
      @update:modelValue="updateServer" />
  </div>
  <ServerVariablesForm
    :variables="server?.variables"
    layout="reference"
    @update:variable="updateServerVariable" />

  <!-- Description -->
  <ScalarMarkdown
    v-if="server?.description"
    class="text-c-3 rounded-b-lg border border-t-0 px-3 py-1.5"
    :value="server.description" />
</template>
