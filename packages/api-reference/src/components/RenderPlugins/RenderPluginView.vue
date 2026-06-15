<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'
import type { PluginViewComponent } from '@/plugins'

const { item, options, eventBus } = defineProps<{
  item: PluginViewComponent
  options: Record<string, any>
  eventBus?: WorkspaceEventBus
}>()

const el = useTemplateRef<HTMLElement>('el')

/**
 * Participate in the existing scroll-spy. We only emit when the view opts into a sidebar
 * entry, because otherwise we would select a navigation item that does not exist and clear
 * the currently active section as the user scrolls past the plugin view.
 */
useIntersection(el, () => {
  if (item.sidebar?.show) {
    eventBus?.emit('intersecting:nav-item', { id: item.id })
  }
})
</script>

<template>
  <!-- The id mirrors the sidebar entry id so navigation can scroll to this element -->
  <div
    :id="item.id"
    ref="el">
    <ScalarErrorBoundary>
      <template v-if="item.renderer">
        <!-- Custom renderer (e.g. React) -->
        <component
          :is="item.renderer"
          v-bind="{
            component: item.component,
            options,
            ...item.props,
          }" />
      </template>
      <template v-else>
        <!-- Vue component -->
        <component
          :is="item.component"
          v-bind="{ options, ...item.props }" />
      </template>
    </ScalarErrorBoundary>
  </div>
</template>
