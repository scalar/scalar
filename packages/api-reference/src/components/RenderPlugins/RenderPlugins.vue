<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'

import { usePluginManager } from '@/plugins'

const { viewName, options } = defineProps<{
  viewName: 'content.end'
  options: Record<string, any>
}>()

const { getViewComponents } = usePluginManager()
const components = getViewComponents(viewName)
</script>

<template>
  <template v-if="components.length">
    <div class="plugin-view">
      <template
        v-for="(item, _index) in components"
        :key="_index">
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
      </template>
    </div>
  </template>
</template>
