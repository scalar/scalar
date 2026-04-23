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

const { eventBus } = defineProps<RouteProps>()

const openCommandPalette = () => {
  eventBus.emit('ui:open:command-palette')
}

/**
 * Open the contextual settings page. Emits the same event as the Cmd/Ctrl+I
 * hotkey so the workspace sidebar handles it uniformly: workspace-level
 * settings from this "Get started" screen, document-level settings when the
 * user is viewing a specific document. No `KeyboardEvent` is attached here
 * because the trigger is a click.
 */
const openSettings = () => {
  eventBus.emit('ui:open:settings')
}

/**
 * Open the contextual search affordance. Emits the same event as the Cmd/Ctrl+J
 * hotkey so the workspace sidebar handles it uniformly: the document filter
 * toggles on the workspace page and the search modal opens inside a document.
 * No `KeyboardEvent` is attached here because the trigger is a click.
 */
const focusSearch = () => {
  eventBus.emit('ui:focus:search')
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
          @click="focusSearch">
          <span>Filter</span>
          <ScalarHotkey
            hotkey="J"
            :modifier="['default']" />
        </button>
      </div>
    </div>
  </div>
</template>
