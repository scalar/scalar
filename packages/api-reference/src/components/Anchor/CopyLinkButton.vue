<script setup lang="ts">
import { ScalarIconHash } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

/**
 * The tree layout's deep-link affordance: the same hash the section headings
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
  <!-- A flex item of the heading, so it wraps with the text. Its layout box is
       the bare icon (the negative margins cancel the padding), so the 22px hit
       area never changes the line height. pointer-coarse: a touch pointer has
       no hover, so the button rests visible. -->
  <button
    class="copy-link-trailing text-c-3 hover:text-c-1 -my-1 ms-1.5 -me-1 flex shrink-0 cursor-pointer items-center justify-center self-center p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
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
