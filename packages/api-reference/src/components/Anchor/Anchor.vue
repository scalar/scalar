<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconHash } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useId } from 'vue'

import { useNavState } from '@/hooks/useNavState'

import ScreenReader from '../ScreenReader.vue'

const { id } = defineProps<{
  id: string
}>()

const labelId = useId()

const { copyToClipboard } = useClipboard()
const { getHashedUrl } = useNavState()

/** Ensure we copy the hash OR path if pathRouting is enabled */
const handleCopy = () => {
  copyToClipboard(getHashedUrl(id))
}
</script>
<template>
  <span class="group/heading word-break-all relative inline-block">
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
        class="absolute left-0 mt-1.75 inline-block h-fit px-2 py-1 opacity-0 group-hover/heading:opacity-100 group-has-focus-visible/heading:opacity-100"
        variant="ghost"
        @click.stop="handleCopy">
        <ScalarIconHash
          aria-hidden="true"
          class="size-4" />
        <ScreenReader>Copy link</ScreenReader>
      </ScalarButton>
    </span>
  </span>
</template>
