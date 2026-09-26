<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconHash } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { useId } from 'vue'

import { useLocalization } from '@/features/localization'

import ScreenReader from '../ScreenReader.vue'

const emit = defineEmits<{
  (e: 'copyAnchorUrl'): void
}>()

const labelId = useId()
const { translate } = useLocalization()

const { cx } = useBindCx()
</script>
<template>
  <span v-bind="cx('group/heading wrap-break-word relative')">
    <span
      :id="labelId"
      class="contents">
      <slot />
    </span>
    <span class="relative">
      <!-- Position anchor to align the copy button to the last line of text  -->
      <span>&ZeroWidthSpace;</span>
      <ScalarButton
        :aria-describedby="labelId"
        class="anchor-copy-button absolute top-1/2 left-0 inline-block h-fit -translate-y-1/2 px-1.5 py-1 opacity-0 group-hover/heading:opacity-100 group-has-focus-visible/heading:opacity-100"
        variant="ghost"
        @click.stop="() => emit('copyAnchorUrl')">
        <ScalarIconHash
          aria-hidden="true"
          class="size-4.5" />
        <ScreenReader>{{ translate('actions.copyLink') }}</ScreenReader>
      </ScalarButton>
    </span>
  </span>
</template>
<style scoped>
/*
 * In the narrow layout the section inset is only 24px (Section.vue) while
 * this box protrudes 30px past the heading text, so a heading that ends near
 * the edge gave the page a horizontal scrollbar at 200-400% zoom (WCAG 1.4.10).
 * Dropping the trailing 6px only there keeps the icon where it is and leaves
 * the desktop focus ring and hit area untouched; the target stays 24x26px
 * (WCAG 2.5.8). The query matches Section.vue's so both flip at the same width.
 */
@container narrow-references-container (max-width: 900px) {
  .anchor-copy-button {
    padding-right: 0;
  }
}
</style>
