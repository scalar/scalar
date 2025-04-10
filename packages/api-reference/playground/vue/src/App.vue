<script setup lang="ts">
import { createApiReference } from '../../../src/index'

import '@scalar/api-reference/style.css'

import type { ApiReferenceConfigurationWithSources } from '@scalar/types/api-reference'
import { onMounted, reactive, ref } from 'vue'

import DebugBar from './components/DebugBar.vue'
import { XCustomExtensionPlugin } from './x-custom-extension-plugin/x-custom-extension-plugin'

const containerRef = ref<HTMLDivElement>()

const configuration = reactive({
  layout: 'modern' as const,
  theme: 'default' as const,
  sources: [
    {
      title: 'Scalar Galaxy',
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
  ],
  showSidebar: true,
  withDefaultFonts: true,
  plugins: [XCustomExtensionPlugin],
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
    plugins: [XCustomExtensionPlugin],
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
