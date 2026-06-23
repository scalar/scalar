<script lang="ts">
type SelectorProps = {
  /** The event bus to use for emitting events */
  eventBus: WorkspaceEventBus
  /** The currently selected server */
  selectedServer: AsyncApiServerEntry | null
  /** Available servers */
  servers: AsyncApiServerEntry[]
}

/**
 * AsyncApiServerSelector
 *
 * Core component for rendering an AsyncAPI server selector block. It mirrors the
 * OpenAPI ServerSelector, but works with the AsyncAPI server shape (a named map
 * of `host`/`protocol`/`pathname` rather than an array of `url`).
 *
 * @event asyncapi-server:update:selected - Emitted when the selected server changes
 * @event asyncapi-server:update:variables - Emitted when a server variable changes
 */
export default {}
</script>

<script lang="ts" setup>
import { ServerVariablesForm } from '@scalar/api-client/components/Server'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, useId } from 'vue'

import { useApiReferenceI18n } from '@/features/i18n'

import Selector from './Selector.vue'

const { eventBus, servers, selectedServer } = defineProps<SelectorProps>()

const id = useId()
const { translate } = useApiReferenceI18n()

/**
 * Normalize AsyncAPI server variables into the shape the shared
 * ServerVariablesForm expects (resolving references and defaulting `default`).
 */
const serverVariables = computed(() => {
  const variables = selectedServer?.server.variables
  if (!variables) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(variables).map(([name, variable]) => {
      const resolved = getResolvedRef(variable)
      return [
        name,
        {
          default: resolved.default ?? '',
          enum: resolved.enum,
          description: resolved.description,
        },
      ]
    }),
  )
})

/** Update the selected server */
const updateServer = (name: string) => {
  eventBus.emit('asyncapi-server:update:selected', { name })
}

/** Update a server variable on the selected server */
const updateServerVariable = (key: string, value: string) => {
  if (!selectedServer) {
    return
  }

  eventBus.emit('asyncapi-server:update:variables', {
    name: selectedServer.name,
    key,
    value,
  })
}
</script>

<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-xl border-x border-t px-3 py-2.5 font-medium">
    {{ translate('server.label') }}
  </label>
  <div
    :id="id"
    class="border"
    :class="{
      'rounded-b-xl': !selectedServer?.description && !serverVariables,
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
    :variables="serverVariables"
    @update:variable="updateServerVariable" />

  <!-- Description -->
  <ScalarMarkdown
    v-if="selectedServer?.description"
    class="text-c-3 rounded-b-xl border-x border-b px-3 py-1.5"
    :value="selectedServer.description" />
</template>
