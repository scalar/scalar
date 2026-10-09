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
import type { ServerVariableObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed, useId } from 'vue'

import AsyncApiDocumentation from '@/components/Content/AsyncApi/AsyncApiDocumentation.vue'
import { useLocalization } from '@/features/localization'

import Selector from './Selector.vue'

const { eventBus, servers, selectedServer } = defineProps<SelectorProps>()

const id = useId()
const { translate } = useLocalization()

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
    Object.entries(variables).flatMap(
      ([name, variable]): [string, ServerVariableObject][] => {
        const resolved = getResolvedRef(variable)
        if (!resolved) return []
        return [
          [
            name,
            {
              default: resolved.default ?? '',
              enum: resolved.enum,
              description: resolved.description,
            },
          ],
        ]
      },
    ),
  )
})

const serverSummary = computed(() => selectedServer?.server.summary?.trim())

const serverProtocolVersion = computed(() => {
  const version = selectedServer?.server.protocolVersion?.trim()
  return version ? `${selectedServer?.protocol.toUpperCase()} ${version}` : ''
})

const hasServerDetails = computed(() =>
  Boolean(
    serverSummary.value ||
    serverProtocolVersion.value ||
    selectedServer?.description ||
    selectedServer?.server.externalDocs ||
    selectedServer?.server.tags?.length,
  ),
)

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
      'rounded-b-xl': !hasServerDetails && !serverVariables,
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

  <div
    v-if="hasServerDetails"
    class="text-c-3 flex flex-col gap-1.5 rounded-b-xl border-x border-b px-3 py-1.5">
    <p
      v-if="serverProtocolVersion"
      class="text-c-2 text-sm">
      {{ serverProtocolVersion }}
    </p>
    <p v-if="serverSummary">{{ serverSummary }}</p>
    <ScalarMarkdown
      v-if="selectedServer?.description"
      :value="selectedServer.description" />
    <AsyncApiDocumentation :owner="selectedServer?.server" />
  </div>
</template>
