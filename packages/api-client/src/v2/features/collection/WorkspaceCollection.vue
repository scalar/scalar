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

const { layout, eventBus } = defineProps<RouteProps>()

const workspaceTitle = 'Workspace Title [replace with name]'
</script>

<template>
  <div class="w-full md:mx-auto md:max-w-[720px]">
    <!-- Header -->
    <div
      :aria-label="`title: ${workspaceTitle}`"
      class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
      <ScalarIconGlobe class="text-c-2 size-6" />

      <div class="group relative ml-1.25">
        <span class="text-c-1 flex h-8 items-center">
          {{ workspaceTitle }}
        </span>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs type="workspace" />

    <!-- Router views -->
    <div class="flex h-full w-full flex-col gap-12 px-1.5 pt-8">
      <RouterView
        :eventBus="eventBus"
        :layout="layout"
        type="workspace" />
    </div>
  </div>
</template>
