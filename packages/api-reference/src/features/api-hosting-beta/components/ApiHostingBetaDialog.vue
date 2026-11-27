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
import { computed, onUnmounted } from 'vue'

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
 * The email field takes focus as the popup opens, since signing up is all the popup is for: it only
 * opens once nobody has touched the page for a moment, so a key that lands there was meant for it.
 * Headless UI would focus it too, as the first control in the panel, but without scrolling, and at
 * high zoom the field can start below the window. Headless UI keeps focus it finds already inside.
 */
const vFocusEmail = {
  mounted: (element: HTMLElement): void => {
    element.querySelector<HTMLInputElement>('input[type="email"]')?.focus()
  },
}

/**
 * Focus goes back where it was before the popup opened. Headless UI only does that when a dialog it
 * keeps mounted closes, and the prompt takes this one away entirely.
 */
const focusBeforeOpening = document.activeElement
onUnmounted(() => {
  if (
    focusBeforeOpening instanceof HTMLElement &&
    focusBeforeOpening.isConnected &&
    (document.activeElement === null ||
      document.activeElement === document.body)
  ) {
    focusBeforeOpening.focus({ preventScroll: true })
  }
})
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
        v-focus-email
        class="h-fit w-full max-w-[480px] overflow-hidden rounded-[16px] border shadow-lg">
        <DeployWaitlist
          :integration
          popup
          @close="emit('close')" />
      </DialogPanel>
    </div>
  </Dialog>
</template>
