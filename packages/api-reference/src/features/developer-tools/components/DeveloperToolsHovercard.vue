<script lang="ts" setup>
/**
 * "Developer Tools" with an info icon, for the localhost shell's toolbar. Hovering, focusing or
 * clicking it shows a card that explains the developer tools and how to turn them off.
 *
 * The card renders right after the trigger instead of being teleported, so Tab moves from the
 * trigger into the card (its copy button) before going on to the rest of the toolbar.
 */
import { ScalarFloating } from '@scalar/components/floating'
import { ScalarIconInfo } from '@scalar/icons'
import { onClickOutside } from '@vueuse/core'
import { onBeforeUnmount, ref, useId, useTemplateRef } from 'vue'

import { useLocalization } from '@/features/localization'

import DeveloperToolsAbout from './DeveloperToolsAbout.vue'

/** Pointer must rest on the trigger this long, so passing over it does not flash the card */
const OPEN_DELAY = 120
/** Grace period for moving the pointer from the trigger onto the card */
const CLOSE_DELAY = 160

const { translate } = useLocalization()
const cardId = useId()

const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const card = useTemplateRef<HTMLElement>('card')

let timer: ReturnType<typeof setTimeout> | undefined

const setOpen = (next: boolean, delay = 0): void => {
  clearTimeout(timer)
  if (delay === 0) {
    open.value = next
    return
  }
  timer = setTimeout(() => (open.value = next), delay)
}

const isInside = (node: EventTarget | null): boolean =>
  node instanceof Node &&
  Boolean(trigger.value?.contains(node) || card.value?.contains(node))

/** Focus leaving both the trigger and the card closes it; moving between them does not */
const onFocusOut = (event: FocusEvent): void => {
  if (!isInside(event.relatedTarget)) {
    setOpen(false, CLOSE_DELAY)
  }
}

/** Set while focus goes back to the trigger, so its focus handler does not reopen the card */
let returningFocus = false

const onTriggerFocus = (): void => {
  if (!returningFocus) {
    setOpen(true)
  }
}

const close = (): void => {
  setOpen(false)
  returningFocus = true
  trigger.value?.focus()
  returningFocus = false
}

// Touch has no pointer leaving the card, so a tap elsewhere closes it
onClickOutside(card, () => setOpen(false), { ignore: [trigger] })

onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <ScalarFloating
    :offset="8"
    placement="bottom-start">
    <button
      ref="trigger"
      :aria-controls="open ? cardId : undefined"
      :aria-expanded="open"
      class="text-c-2 hover:text-c-1 hover:bg-b-3 aria-expanded:text-c-1 aria-expanded:bg-b-3 flex h-8 items-center gap-2 rounded-lg px-2 text-sm leading-none"
      type="button"
      @click="setOpen(true)"
      @focus="onTriggerFocus"
      @focusout="onFocusOut"
      @keydown.escape.prevent="close"
      @pointerenter="setOpen(true, OPEN_DELAY)"
      @pointerleave="setOpen(false, CLOSE_DELAY)">
      {{ translate('developerTools.title') }}
      <ScalarIconInfo class="size-4" />
    </button>
    <template
      v-if="open"
      #floating>
      <div
        :id="cardId"
        ref="card"
        class="bg-b-1 text-c-1 flex w-90 flex-col gap-3 rounded-lg border p-4 text-sm shadow-lg"
        @focusout="onFocusOut"
        @keydown.escape.prevent="close"
        @pointerenter="setOpen(true)"
        @pointerleave="setOpen(false, CLOSE_DELAY)">
        <div class="flex flex-col gap-2 leading-relaxed">
          <DeveloperToolsAbout />
        </div>
        <p class="text-c-2 m-0 flex items-center gap-1 text-xs">
          <ScalarIconInfo class="size-3.5 shrink-0" />
          {{ translate('developerTools.localhostOnly') }}
        </p>
      </div>
    </template>
  </ScalarFloating>
</template>
