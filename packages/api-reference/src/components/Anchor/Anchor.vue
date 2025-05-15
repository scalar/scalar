<script setup lang="ts">
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
  <span class="label">
    <span
      :id="labelId"
      class="contents">
      <slot />
    </span>
    <span class="anchor">
      <!-- Position anchor to align the copy button to the last line of text  -->
      <span>&ZeroWidthSpace;</span>
      <button
        :aria-describedby="labelId"
        class="anchor-copy"
        type="button"
        @click.stop="handleCopy">
        <span aria-hidden="true">#</span>
        <ScreenReader>Copy link</ScreenReader>
      </button>
    </span>
  </span>
</template>
<style scoped>
.label {
  position: relative;
  display: inline-block;
  word-break: break-all;
}
.anchor {
  position: relative;
  display: inline-block;
  opacity: 0;
}

.anchor-copy {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);

  cursor: pointer;

  padding: 0 6px;

  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  font-size: 0.8em;
}

.anchor-copy:hover,
.anchor-copy:focus-visible {
  color: var(--scalar-color-2);
}

.label:hover .anchor,
.label:has(:focus-visible) .anchor {
  opacity: 1;
}
</style>
