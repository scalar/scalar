<script setup lang="ts">
import { ScalarButton, useBindCx } from '@scalar/components'
import { ScalarIconHash } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useId } from 'vue'

import { useNavState } from '@/hooks/useNavState'

import ScreenReader from '../ScreenReader.vue'

const { id } = defineProps<{
  id: string
}>()

const labelId = useId()

const { cx } = useBindCx()

const { copyToClipboard } = useClipboard()
const { getHashedUrl } = useNavState()

/** Ensure we copy the hash OR path if pathRouting is enabled */
const handleCopy = () => {
  copyToClipboard(getHashedUrl(id))
}
</script>
<template>
  <span v-bind="cx('group/heading word-break-all relative')">
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
        class="absolute top-1/2 left-0 inline-block h-fit -translate-y-1/2 px-1.5 py-1 opacity-0 group-hover/heading:opacity-100 group-has-focus-visible/heading:opacity-100"
        variant="ghost"
        @click.stop="handleCopy">
        <ScalarIconHash
          aria-hidden="true"
          class="size-4.5" />
        <ScreenReader>Copy link</ScreenReader>
      </ScalarButton>
    </span>
  </span>
</template>
