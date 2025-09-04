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
import { emitCustomEvent } from '@scalar/workspace-store/events'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { templateRef } from '@vueuse/core'
import { computed, nextTick, useId, watch } from 'vue'

import Selector from './Selector.vue'

const { servers, xSelectedServer } = defineProps<SelectorProps>()
const id = useId()
const updateServer = (newServer: string) => {
  emitCustomEvent(containerRef.value, 'scalar-update-selected-server', {
    value: newServer,
  })
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

    // Wait for next tick to ensure containerRef is available
    nextTick(() => {
      updateServer(newServers[0].url)
    })
  },
  { immediate: true },
)

/** Reference to the main container element for event emission */
const containerRef = templateRef('containerRef')
</script>

<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-lg border border-b-0 px-3 py-2.5 font-medium">
    Server
  </label>
  <div
    :id="id"
    ref="containerRef"
    class="border"
    :class="{
      'rounded-b-lg': !server?.description && !server?.variables,
    }">
    <Selector
      v-if="servers.length"
      :servers="servers"
      :target="id"
      :xSelectedServer="xSelectedServer"
      @update:modelValue="updateServer" />
  </div>
  <ServerVariablesForm
    layout="reference"
    :variables="server?.variables"
    @update:variable="updateServerVariable" />

  <!-- Description -->
  <ScalarMarkdown
    v-if="server?.description"
    class="text-c-3 rounded-b-lg border border-t-0 px-3 py-1.5"
    :value="server.description" />
</template>
