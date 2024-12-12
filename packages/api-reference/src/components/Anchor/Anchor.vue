<script setup lang="ts">
import { useNavState } from '@/hooks'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import ScreenReader from '../ScreenReader.vue'

defineProps<{
  id: string
}>()

const { copyToClipboard } = useClipboard()
const { getHashedUrl } = useNavState()
const getUrlWithId = (id: string) => {
  return getHashedUrl(id)
}
</script>
<template>
  <span class="label">
    <slot />
    <span class="anchor">
      <!-- Position anchor to align the copy button to the last line of text  -->
      <span>&ZeroWidthSpace;</span>
      <button
        class="anchor-copy"
        type="button"
        @click.stop="copyToClipboard(getUrlWithId(id))">
        <span aria-hidden="true">#</span>
        <ScreenReader>Copy link to "<slot />"</ScreenReader>
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
