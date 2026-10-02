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
  <!-- A flex item of the heading, so it wraps with the text. Negative margins
       cancel the padding of the 24px hit area WCAG 2.5.8 asks for, so the box
       overhangs the line instead of taking room from it: vertically it never
       changes the line height, and horizontally the row gives up only the 10px
       gap and the 14px icon (5 + 24 - 5), which is what a collapsed preview
       before it truncates against.

       Both inline margins carry `!`: the heading's scoped `.property-heading > *`
       sets a 9px right margin, which is the end margin in LTR and the start
       margin in RTL, at the same specificity as the utility. Which one wins
       depends on whether the consumer's stylesheet puts the utilities before or
       after `vue-styles.css`.

       pointer-coarse drops it entirely rather than leaving it transparent: a
       touch pointer has no hover, so a still-laid-out button would be an
       invisible tap target AND would keep pushing long signature lines onto a
       second line just to show a control nobody can see. A deep link stays
       reachable there through the address bar. -->
  <button
    class="copy-link-trailing text-c-3 hover:text-c-1 -my-1.25 ms-1.25! -me-1.25! flex shrink-0 cursor-pointer items-center justify-center self-center p-1.25 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden"
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
