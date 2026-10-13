<script setup lang="ts">
import { ScalarSidebarSection } from '@scalar/components/sidebar'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import {
  getAsyncApiProtocols,
  getAsyncApiServerOptions,
} from '@scalar/workspace-store/channel-example'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed, type Component } from 'vue'

import { getAsyncApiTagOptions } from '../helpers/get-async-api-tag-options'
import SidebarFilter from './SidebarFilter.vue'

/**
 * AsyncApiSidebarFilters
 *
 * The "Filters" sidebar section shown for AsyncAPI documents. Bundling the
 * native sidebar title and pickers here keeps the modern and classic layouts
 * (modern and classic) from each repeating the option-building logic.
 *
 * Each picker hides itself when there is nothing to choose from, and the whole
 * section hides when no picker has a real choice — so passing an OpenAPI
 * document (or `null`) renders nothing.
 */
const {
  document,
  entries = [],
  is = 'li',
} = defineProps<{
  /** The active document, or `null` for OpenAPI documents (renders nothing). */
  document: AsyncApiDocument | null
  /** Unfiltered navigation entries, excluding hidden content. */
  entries?: TraversedEntry[]
  /** Render element for the sidebar section wrapper. */
  is?: Component | string
}>()

/** Selected protocol id; empty string clears the filter. */
const protocol = defineModel<string>('protocol', { default: '' })

/** Selected server name; empty string clears the filter. */
const server = defineModel<string>('server', { default: '' })
const tag = defineModel<string>('tag', { default: '' })
const tagOptions = computed(() =>
  document ? getAsyncApiTagOptions(document, entries) : [],
)
// A single tag can still distinguish tagged content from untagged content.
const showTag = computed(() => tagOptions.value.length > 1)

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
    v-if="showProtocol || showServer || showTag"
    class="asyncapi-sidebar-filters">
    Filters
    <template #items>
      <SidebarFilter
        v-if="showTag"
        v-model="tag"
        label="Tag"
        :options="tagOptions" />
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
