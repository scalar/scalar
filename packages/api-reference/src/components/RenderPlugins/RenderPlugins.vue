<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { usePluginManager } from '@/plugins'

import RenderPluginView from './RenderPluginView.vue'

const { viewName, options, eventBus } = defineProps<{
  viewName: 'content.start' | 'content.end'
  options: Record<string, any>
  eventBus?: WorkspaceEventBus
}>()

const { getViewComponents } = usePluginManager()
const components = getViewComponents(viewName)
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
