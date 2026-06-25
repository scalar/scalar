<script setup lang="ts">
import { ScalarIconFunnel } from '@scalar/icons'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import {
  getAsyncApiProtocols,
  getAsyncApiServerOptions,
} from '@scalar/workspace-store/channel-example'
import { computed } from 'vue'

import SidebarFilter from './SidebarFilter.vue'

/**
 * AsyncApiSidebarFilters
 *
 * The "Filters" card shown in the AsyncAPI sidebar: a bordered panel with a
 * funnel header and the stacked protocol + server pickers. Bundling them here
 * keeps the two sidebar layouts (modern and classic) from each repeating the
 * picker pair and the option-building logic.
 *
 * Each picker hides itself when there is nothing to choose from, and the whole
 * card hides when neither picker has a real choice — so passing an OpenAPI
 * document (or `null`) renders nothing.
 */
const { document } = defineProps<{
  /** The active document, or `null` for OpenAPI documents (renders nothing). */
  document: AsyncApiDocument | null
}>()

/** Selected protocol id; empty string clears the filter. */
const protocol = defineModel<string>('protocol', { default: '' })

/** Selected server name; empty string clears the filter. */
const server = defineModel<string>('server', { default: '' })

/** Protocol picker options, including the leading "All protocols" entry. */
const protocolOptions = computed(() =>
  document ? getAsyncApiProtocols(document) : [],
)

/** Server picker options, including the leading "All servers" entry. */
const serverOptions = computed(() =>
  document ? getAsyncApiServerOptions(document) : [],
)

/** Each picker is only worth showing when there is a choice beyond "All …". */
const showProtocol = computed(() => protocolOptions.value.length > 2)
const showServer = computed(() => serverOptions.value.length > 2)
</script>

<template>
  <div
    v-if="showProtocol || showServer"
    class="asyncapi-sidebar-filters mx-3 mt-3 rounded border p-3">
    <div class="text-c-1 mb-2.5 flex items-center gap-2 font-medium">
      <ScalarIconFunnel class="size-4" />
      <span class="text-base">Filters</span>
    </div>
    <div class="flex flex-col gap-2.5 border-t pt-2.5">
      <SidebarFilter
        v-if="showProtocol"
        v-model="protocol"
        label="Protocol"
        :options="protocolOptions" />
      <SidebarFilter
        v-if="showServer"
        v-model="server"
        label="Server"
        :options="serverOptions" />
    </div>
  </div>
</template>
