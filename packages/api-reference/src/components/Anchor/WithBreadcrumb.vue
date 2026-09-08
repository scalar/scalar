<script setup lang="ts">
import { ScalarIconLink } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

const { breadcrumb, placement = 'leading' } = defineProps<{
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  /**
   * Where the copy-link button sits.
   *
   * `leading` hangs it in the left margin (the legacy layout). The tree layout
   * puts its disclosure control there, so it uses `trailing`: a hash after the
   * row's text, like the section headings, that stays in the tab order and is
   * revealed by focus as well as hover rather than being a mouse-only affordance.
   */
  placement?: 'leading' | 'trailing'
}>()
const { translate } = useLocalization()

/** Screen-reader label for the copy-link button, naming the deep-linked item. */
const copyLinkLabel = computed(() =>
  translate('actions.copyLinkTo', {
    name: breadcrumb?.[breadcrumb.length - 1] ?? '',
  }),
)
</script>

<template>
  <template v-if="breadcrumb && breadcrumb.length > 0">
    <!-- `tabindex="-1"`: focusable programmatically but out of the tab order,
         so a deep link can move focus to its target instead of leaving keyboard
         and screen-reader users at the top of the document -->
    <div
      :id="breadcrumb.join('.')"
      class="scroll-mt-24"
      :class="placement === 'trailing' ? 'static' : 'relative'"
      tabindex="-1">
      <!-- Content -->
      <slot />
      <!-- `trailing` draws no button here; the row's heading renders it as its
           last child so tab order matches visual order. See CopyLinkButton.vue -->
      <button
        v-if="placement !== 'trailing'"
        class="text-c-3 hover:text-c-1 absolute -top-2 -left-4.5 flex h-[calc(100%+16px)] w-4.5 cursor-pointer items-center justify-center pr-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        type="button"
        @click="
          () =>
            eventBus?.emit('copy-url:nav-item', { id: breadcrumb.join('.') })
        ">
        <!-- Copy button -->
        <ScalarIconLink
          class="size-3"
          weight="bold" />
        <span class="sr-only">
          <slot name="sr-label">{{ copyLinkLabel }}</slot>
        </span>
      </button>
    </div>
  </template>
  <template v-else>
    <slot />
  </template>
</template>
