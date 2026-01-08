<script lang="ts">
/**
 * Document Collection Page
 *
 * Displays primary document editing and viewing interface, enabling users navigate among
 * Overview, Servers, Authentication, Environment, Cookies, and Settings tabs
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarIconGlobe } from '@scalar/icons'
import { RouterView } from 'vue-router'

import type { RouteProps } from '@/v2/features/app/helpers/routes'

import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()
</script>

<template>
  <div class="custom-scroll h-full">
    <div class="w-full md:mx-auto md:max-w-[720px]">
      <!-- Header -->
      <div
        :aria-label="`title: ${activeWorkspace.label}`"
        class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
        <ScalarIconGlobe class="text-c-2 size-6" />

        <div class="group relative ml-1.25">
          <span class="text-c-1 flex h-8 items-center">
            {{ activeWorkspace.label }}
          </span>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs type="workspace" />

      <!-- Router views -->
      <div class="px-1.5 py-8">
        <RouterView
          v-bind="props"
          collectionType="workspace" />
      </div>
    </div>
  </div>
</template>
