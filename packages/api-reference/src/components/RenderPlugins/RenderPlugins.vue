<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed } from 'vue'

import { usePluginManager } from '@/plugins'

import RenderPluginView from './RenderPluginView.vue'

const { viewName, options, eventBus, documentSlug } = defineProps<{
  viewName: 'content.start' | 'content.end'
  options: Record<string, any>
  eventBus?: WorkspaceEventBus
  /** Slug of the active document, used to scope plugin view ids for navigation and deep-linking */
  documentSlug: string
}>()

const { getViewComponents } = usePluginManager()
const components = computed(() => getViewComponents(viewName, documentSlug))
</script>

<template>
  <div
    v-if="components.length"
    class="plugin-view">
    <RenderPluginView
      v-for="item in components"
      :key="item.id"
      :eventBus="eventBus"
      :item="item"
      :options="options" />
  </div>
</template>
