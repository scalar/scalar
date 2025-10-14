<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { usePluginManager } from '@/plugins'

const { viewName, store, options } = defineProps<{
  viewName: string
  store: WorkspaceStore
  options: Record<string, any>
}>()

const { getViewComponents } = usePluginManager()
const components = getViewComponents(viewName)
</script>

<template>
  <template v-if="components.length">
    <div class="plugin-view">
      <template
        v-for="(item, index) in components"
        :key="index">
        <ScalarErrorBoundary>
          <template v-if="item.renderer">
            <!-- Custom renderer (e.g., React) -->
            <component
              :is="item.renderer"
              v-bind="{
                component: item.component,
                store,
                options,
                ...item.props,
              }" />
          </template>
          <template v-else>
            <!-- Vue component -->
            <component
              :is="item.component"
              v-bind="{ store, options, ...item.props }" />
          </template>
        </ScalarErrorBoundary>
      </template>
    </div>
  </template>
</template>
