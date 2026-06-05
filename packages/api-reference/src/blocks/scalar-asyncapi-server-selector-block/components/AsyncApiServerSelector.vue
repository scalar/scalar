<script lang="ts">
type SelectorProps = {
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
 * Selection is tracked locally for now: the workspace-store server mutators
 * assume the OpenAPI server shape, so AsyncAPI selection is not yet persisted.
 */
export default {}
</script>

<script lang="ts" setup>
import { ServerVariablesForm } from '@scalar/api-client/components/Server'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, ref, useId, watch } from 'vue'

import Selector from './Selector.vue'

const { servers, selectedServer } = defineProps<SelectorProps>()

const id = useId()

/**
 * Local-only selection state, keyed by server name. AsyncAPI server selection is
 * not yet persisted to the workspace store, so we keep the choice in the
 * component while still letting users switch between servers.
 */
const selectedName = ref(selectedServer?.name ?? null)

// Re-sync the local selection when the incoming selection changes.
watch(
  () => selectedServer?.name,
  (name) => {
    selectedName.value = name ?? null
  },
)

/** The server matching the local selection, falling back to none. */
const activeServer = computed(
  () => servers.find((server) => server.name === selectedName.value) ?? null,
)

/**
 * Normalize AsyncAPI server variables into the shape the shared
 * ServerVariablesForm expects (resolving references and defaulting `default`).
 */
const serverVariables = computed(() => {
  const variables = activeServer.value?.server.variables
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

/** Toggle the selected server (selecting the active server clears it). */
const updateServer = (name: string) => {
  selectedName.value = selectedName.value === name ? null : name
}
</script>

<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-xl border-x border-t px-3 py-2.5 font-medium">
    Server
  </label>
  <div
    :id="id"
    class="border"
    :class="{
      'rounded-b-xl': !activeServer?.description && !serverVariables,
    }">
    <Selector
      v-if="servers.length"
      :selectedServer="activeServer"
      :servers="servers"
      :target="id"
      @update:modelValue="updateServer" />
  </div>
  <ServerVariablesForm
    layout="reference"
    :variables="serverVariables" />

  <!-- Description -->
  <ScalarMarkdown
    v-if="activeServer?.description"
    class="text-c-3 rounded-b-xl border-x border-b px-3 py-1.5"
    :value="activeServer.description" />
</template>
