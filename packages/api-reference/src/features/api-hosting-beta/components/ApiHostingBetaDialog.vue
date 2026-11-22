<script lang="ts">
/**
 * The API Hosting beta card as a popup over the reference. Headless UI's `Dialog` contains focus,
 * and Escape or a click outside the card dismisses it. The backdrop is the same dim the other popups
 * use; the card brings its own chrome.
 */
export default {}
</script>

<script setup lang="ts">
import { Dialog } from '@headlessui/vue'

import { computed } from 'vue'

import { toLanguageTag, useLocalization } from '@/features/localization'

import ApiHostingBetaCard from './ApiHostingBetaCard.vue'

const { open, framework } = defineProps<{
  open: boolean
  /** The server framework serving the reference, picked in advance on the card. */
  framework?: string
}>()

const emit = defineEmits<{
  /** The close button, Escape, a click outside the card, or Done after joining. */
  (event: 'close'): void
}>()

const { translate, locale, direction } = useLocalization()

/** The same `lang` the reference root carries, which the portal cannot inherit from it. */
const lang = computed<string>(() => toLanguageTag(locale.value))

/**
 * The reference's hotkeys listen on the window and would act on the page under the popup: Cmd+K
 * opens search beneath it. They take Ctrl, Command or Option, so those combinations stop at the
 * popup. Escape and Tab carry on to the dialog's own handlers, and the browser's defaults, such as
 * copy and paste, still run.
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
  <!-- The card's heading changes once someone joins, so the dialog is named for what it is rather
       than after either heading. It renders in a portal outside the reference, so it takes the
       reference's language and direction itself. -->
  <Dialog
    :aria-label="translate('developerTools.hostingBetaLabel')"
    class="z-overlay fixed inset-0"
    :dir="direction"
    :lang
    :open
    @close="emit('close')"
    @keydown="keepHotkeysInside">
    <div
      aria-hidden="true"
      class="bg-backdrop dark:bg-backdrop-dark absolute inset-0" />
    <ApiHostingBetaCard
      :framework
      @close="emit('close')" />
  </Dialog>
</template>
