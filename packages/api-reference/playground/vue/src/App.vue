<script setup lang="ts">
import { createApiReference } from '../../../src/index'

import '@scalar/api-reference/style.css'

import type { ApiReferenceConfigurationWithSources } from '@scalar/types/api-reference'
import { nextTick, onMounted, reactive, ref } from 'vue'

import DebugBar from './components/DebugBar.vue'

const containerRef = ref<HTMLDivElement>()

const configuration = reactive({
  theme: 'default',
  spec: {
    sources: [
      {
        title: 'Scalar Galaxy',
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      },
    ],
  },
  showSidebar: true,
  withDefaultFonts: true,
})

let app: ReturnType<typeof createApiReference> | null = null

onMounted(async () => {
  app = createApiReference(containerRef.value, configuration)
})

const updateConfiguration = (
  newConfiguration: Partial<ApiReferenceConfigurationWithSources>,
) => {
  app?.updateConfiguration(newConfiguration)
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Main content -->
    <div class="flex-1">
      <div ref="containerRef"></div>
    </div>

    <!-- Sidebar -->
    <div
      class="sticky top-0 h-screen w-96 border-l border-stone-800 bg-stone-900">
      <DebugBar
        v-model="configuration"
        @update:modelValue="updateConfiguration" />
    </div>
  </div>
</template>
