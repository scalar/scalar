<script setup lang="ts">
import { ScalarSidebarSection } from '@scalar/components/sidebar'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import {
  getAsyncApiProtocols,
  getAsyncApiServerOptions,
} from '@scalar/workspace-store/channel-example'
import { computed, type Component } from 'vue'

import SidebarFilter from './SidebarFilter.vue'

/**
 * AsyncApiSidebarFilters
 *
 * The "Filters" sidebar section shown for AsyncAPI documents. Bundling the
 * native sidebar title and picker pair here keeps the two sidebar layouts
 * (modern and classic) from each repeating the option-building logic.
 *
 * Each picker hides itself when there is nothing to choose from, and the whole
 * section hides when neither picker has a real choice — so passing an OpenAPI
 * document (or `null`) renders nothing.
 */
const { document, is = 'li' } = defineProps<{
  /** The active document, or `null` for OpenAPI documents (renders nothing). */
  document: AsyncApiDocument | null
  /** Render element for the sidebar section wrapper. */
  is?: Component | string
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
  <ScalarSidebarSection
    :is
    v-if="showProtocol || showServer"
    class="asyncapi-sidebar-filters">
    Filters
    <template #items>
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
    </template>
  </ScalarSidebarSection>
</template>
