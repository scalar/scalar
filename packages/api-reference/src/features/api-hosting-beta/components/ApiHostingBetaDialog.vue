<script lang="ts">
/**
 * The API Hosting beta invitation as a popup: the Deploy panel's waitlist card in a dialog over the
 * reference, so the popup and the panel are one sign-up. Headless UI's `Dialog` contains focus, and
 * Escape or a click outside the card dismisses it.
 */
export default {}
</script>

<script setup lang="ts">
import { Dialog, DialogPanel } from '@headlessui/vue'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

import DeployWaitlist from '@/features/developer-tools/components/DeployWaitlist.vue'
import { getServerFramework } from '@/features/developer-tools/server-frameworks'
import { toLanguageTag, useLocalization } from '@/features/localization'

const { integration } = defineProps<{
  /** The framework serving the reference, set by the Scalar integrations */
  integration?: ApiReferenceConfiguration['_integration']
}>()

const emit = defineEmits<{
  /** The card's close button, Done after joining, Escape, or a click outside the card. */
  (event: 'close'): void
}>()

const { translate, locale, direction } = useLocalization()

/** Named like the card's heading, which names the framework when one serves the reference */
const label = computed<string>(() => {
  const framework = getServerFramework(integration)
  return framework
    ? translate('developerTools.deployFrameworkTitle', {
        framework: framework.name,
      })
    : translate('developerTools.deployApiTitle')
})

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

/**
 * The card's heading takes focus as the popup opens, so it is read first and a key pressed as the
 * popup appears lands nowhere: the popup opened by itself. Headless UI keeps focus it finds already
 * inside the panel, so this stands in for its initial focus, which would otherwise land on the email
 * field.
 */
const vFocusHeading = {
  mounted: (element: HTMLElement): void => {
    const heading = element.querySelector('h2')
    if (heading) {
      heading.tabIndex = -1
      heading.style.outline = 'none'
      heading.focus({ preventScroll: true })
    }
  },
}
</script>

<template>
  <!-- It renders in a portal outside the reference, so it takes the reference's language and
       direction itself -->
  <Dialog
    :aria-label="label"
    class="z-overlay fixed inset-0"
    :dir="direction"
    :lang
    open
    @close="emit('close')"
    @keydown="keepHotkeysInside">
    <div
      aria-hidden="true"
      class="bg-backdrop dark:bg-backdrop-dark absolute inset-0" />
    <!-- The overlay scrolls, so a card taller than the window is never cut off. The card is 480px
         wide where the window has room, a size up from the side panel, and narrows on small screens. -->
    <div
      class="custom-scroll relative flex h-full justify-center overflow-y-auto px-4 pt-[10vh] pb-16">
      <DialogPanel
        v-focus-heading
        class="h-fit w-full max-w-[480px] overflow-hidden rounded-[16px] border shadow-lg">
        <DeployWaitlist
          :integration
          popup
          @close="emit('close')" />
      </DialogPanel>
    </div>
  </Dialog>
</template>
