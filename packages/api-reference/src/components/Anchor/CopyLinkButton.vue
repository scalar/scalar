<script setup lang="ts">
import { ScalarIconHash } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

/**
 * A property row's deep-link affordance: the same hash the section headings
 * and the models list show, trailing the row's text in the flow of the heading
 * and revealed on hover or focus. It is a separate component so it can render
 * as the LAST child of the heading: inside `WithBreadcrumb`, which wraps the
 * name, it would come before the type in the tab order (WCAG 2.4.3).
 */
const { anchorId } = defineProps<{
  /** The anchor this button copies a link to */
  anchorId: string
  eventBus: WorkspaceEventBus | null
}>()

const { translate } = useLocalization()

/** Screen-reader label for the copy-link button, naming the deep-linked item. */
const copyLinkLabel = computed(() =>
  translate('actions.copyLinkTo', {
    name: anchorId.split('.').pop() ?? '',
  }),
)
</script>

<template>
  <!-- A flex item of the heading, so it wraps with the text. The vertical
       padding is cancelled by negative margins, so the 24px hit area WCAG
       2.5.8 asks for never changes the line height. Horizontally the heading's
       scoped `.property-heading > *` gives every child a 9px trailing margin
       (it beats any -me-* utility on specificity), so `ms-1.25` and `me-2!`
       keep the icon 10px after the text (5 + 5, as 6 + 4 was) and the line's
       trailing extent at the 37px it had with the old 22px box
       (5 + 24 + 8 = 6 + 22 + 9), so wrap points do not move. Only the box, and
       with it the focus ring, grows by 1px a side.

       pointer-coarse drops it entirely rather than leaving it transparent: a
       touch pointer has no hover, so a still-laid-out button would be an
       invisible tap target AND would keep pushing long signature lines onto a
       second line just to show a control nobody can see. A deep link stays
       reachable there through the address bar. -->
  <button
    class="copy-link-trailing text-c-3 hover:text-c-1 -my-1.25 ms-1.25 me-2! flex shrink-0 cursor-pointer items-center justify-center self-center p-1.25 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden"
    type="button"
    @click="() => eventBus?.emit('copy-url:nav-item', { id: anchorId })">
    <ScalarIconHash
      aria-hidden="true"
      class="size-3.5" />
    <span class="sr-only">
      <slot name="sr-label">{{ copyLinkLabel }}</slot>
    </span>
  </button>
</template>
