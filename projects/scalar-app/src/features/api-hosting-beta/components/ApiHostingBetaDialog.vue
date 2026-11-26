<script lang="ts">
/**
 * The API Hosting beta card as a popup over the app. Headless UI's `Dialog` contains focus, and
 * Escape or a click outside the card dismisses it. The backdrop is the same dim the other popups
 * use; the card brings its own chrome.
 */
export default {}
</script>

<script setup lang="ts">
import { Dialog } from '@headlessui/vue'

import ApiHostingBetaCard from './ApiHostingBetaCard.vue'

const {
  open,
  email,
  fetch: sendRequest,
} = defineProps<{
  open: boolean
  /** Fills the sign-up in advance with the logged-in account's address. */
  email?: string
  /** Sends the sign-up, when the app brings its own fetch (the desktop app does). */
  fetch?: typeof fetch
}>()

const emit = defineEmits<{
  /** The close button, Escape, a click outside the card, or Done after joining. */
  (event: 'close'): void
}>()

/**
 * The app's hotkeys listen on the window and would act on the page under the popup: Cmd+Enter
 * sends the request behind it, and Cmd+K opens the command palette beneath it. They all take Ctrl,
 * Command or Option, so those combinations stop at the popup. Escape and Tab carry on to the
 * dialog's own handlers, and the browser's defaults, such as copy and paste, still run.
 */
const keepHotkeysInside = (event: KeyboardEvent): void => {
  if (
    (event.ctrlKey || event.metaKey || event.altKey) &&
    event.key !== 'Escape' &&
    event.key !== 'Tab'
  ) {
    event.stopPropagation()
  }
}
</script>

<template>
  <!-- The card's heading changes once someone joins, so the dialog is named for what it is
       rather than after either heading -->
  <Dialog
    aria-label="API Hosting beta"
    class="z-overlay fixed inset-0"
    :open
    @close="emit('close')"
    @keydown="keepHotkeysInside">
    <div
      aria-hidden="true"
      class="bg-backdrop dark:bg-backdrop-dark absolute inset-0" />
    <ApiHostingBetaCard
      :email
      :fetch="sendRequest"
      @close="emit('close')" />
  </Dialog>
</template>
