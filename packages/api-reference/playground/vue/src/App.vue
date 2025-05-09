<script setup lang="ts">
import { createApiReference } from '../../../src/index'

import '@scalar/api-reference/style.css'

import type { ApiReferenceConfigurationWithSources } from '@scalar/types/api-reference'
import { onMounted, reactive, ref } from 'vue'

import DebugBar from './components/DebugBar.vue'
import { sources } from './content/sources'
import { MyCustomPlugin } from './x-custom-extension-plugin/my-custom-plugin'

const containerRef = ref<HTMLDivElement>()

const plugins = [MyCustomPlugin()]

const configuration = reactive({
  layout: 'modern' as const,
  theme: 'default' as const,
  sources: sources,
  showSidebar: true,
  withDefaultFonts: true,
  plugins,
})

let app: ReturnType<typeof createApiReference> | null = null

onMounted(async () => {
  app = createApiReference(containerRef.value, configuration)
})

const updateConfiguration = (
  newConfiguration: Partial<ApiReferenceConfigurationWithSources>,
) => {
  Object.assign(configuration, newConfiguration)
  app?.updateConfiguration({
    ...newConfiguration,
    plugins,
  })
}
</script>

<template>
  <div class="flex h-dvh min-h-dvh overflow-hidden">
    <!-- Main content -->
    <div class="flex-1 overflow-y-auto">
      <div ref="containerRef"></div>
    </div>
    <!-- Sidebar -->
    <div class="w-96 overflow-y-auto border-l border-stone-800 bg-stone-900">
      <DebugBar
        v-model="configuration"
        @update:modelValue="updateConfiguration" />
    </div>
  </div>
</template>
