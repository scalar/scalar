<script setup lang="ts">
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
 * The stacked protocol + server pickers shown at the top of the AsyncAPI sidebar.
 * Bundling them here keeps the two sidebar layouts (modern and classic) from each
 * repeating the picker pair and the option-building logic.
 *
 * Each picker hides itself when there is nothing to choose from, so passing an
 * OpenAPI document (or `null`) renders nothing.
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
</script>

<template>
  <SidebarFilter
    v-model="protocol"
    :options="protocolOptions" />
  <SidebarFilter
    v-model="server"
    :options="serverOptions" />
</template>
