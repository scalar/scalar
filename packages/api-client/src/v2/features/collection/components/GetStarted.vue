<script lang="ts">
/**
 * Workspace get started page.
 *
 * Shown as the landing view for a workspace with no request selected. Displays
 * an ASCII art mark and a short list of keyboard shortcuts to help the user
 * bootstrap their workspace (open the command palette, jump to settings, or
 * focus the sidebar filter).
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarHotkey } from '@scalar/components'

import Computer from '@/assets/computer.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

const { eventBus, activeWorkspace } = defineProps<RouteProps>()

const openCommandPalette = () => {
  eventBus.emit('ui:open:command-palette')
}

const openSettings = () => {
  eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'settings',
    namespace: activeWorkspace.id,
  })
}
</script>

<template>
  <div class="flex h-full w-full flex-col items-center justify-center p-6">
    <div class="flex flex-col items-stretch gap-10">
      <ScalarAsciiArt
        :art="Computer"
        class="text-c-3 self-center" />

      <div class="text-c-2 flex flex-col gap-3 text-sm">
        <button
          class="hover:text-c-1 flex w-full items-center justify-between gap-8"
          type="button"
          @click="openCommandPalette">
          <span>Get Started</span>
          <ScalarHotkey
            hotkey="K"
            :modifier="['default']" />
        </button>
        <button
          class="hover:text-c-1 flex w-full items-center justify-between gap-8"
          type="button"
          @click="openSettings">
          <span>Settings</span>
          <ScalarHotkey
            hotkey="I"
            :modifier="['default']" />
        </button>
        <button
          class="hover:text-c-1 flex w-full items-center justify-between gap-8"
          type="button"
          @click="
            () => {
              console.log(`todo: focus filter`)
            }
          ">
          <span>Filter</span>
          <ScalarHotkey
            hotkey="J"
            :modifier="['default']" />
        </button>
      </div>
    </div>
  </div>
</template>
