<script lang="ts">
type SelectorProps = {
  /** The event bus to use for emitting events */
  eventBus: WorkspaceEventBus
  /** The selected server  */
  selectedServer: ServerObject | null
  /** Available servers */
  servers: ServerObject[]
}

/**
 * ServerSelector
 *
 * Core component for rendering a server selector block.
 * Handles server selection and emits a 'server:update:selected' event when the selected server changes.
 *
 * @event server:update:selected - Emitted when the selected server changes
 * @event server:update:variables - Emitted when a server variable changes
 */
export default {}
</script>

<script lang="ts" setup>
import { ServerVariablesForm } from '@scalar/api-client/components/Server'
import { ScalarMarkdown } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { useId } from 'vue'

import Selector from './Selector.vue'

const { eventBus, servers, selectedServer } = defineProps<SelectorProps>()

const id = useId()

/** Update the selected server */
const updateServer = (newServer: string) => {
  eventBus.emit('server:update:selected', {
    url: selectedServer?.url === newServer ? '' : newServer,
  })
}

/** Update the server variable */
const updateServerVariable = (key: string, value: string) => {
  /** Find the index of the selected server */
  const index = servers.findIndex((s) => s.url === selectedServer?.url)
  if (index === -1) {
    return
  }

  eventBus.emit('server:update:variables', {
    index,
    key,
    value,
  })
}
</script>

<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-lg border border-b-0 px-3 py-2.5 font-medium">
    Server
  </label>
  <div
    :id="id"
    class="border"
    :class="{
      'rounded-b-lg':
        !selectedServer?.description && !selectedServer?.variables,
    }">
    <Selector
      v-if="servers.length"
      :selectedServer
      :servers="servers"
      :target="id"
      @update:modelValue="updateServer" />
  </div>
  <ServerVariablesForm
    layout="reference"
    :variables="selectedServer?.variables"
    @update:variable="updateServerVariable" />

  <!-- Description -->
  <ScalarMarkdown
    v-if="selectedServer?.description"
    class="text-c-3 rounded-b-lg border border-t-0 px-3 py-1.5"
    :value="selectedServer.description" />
</template>
