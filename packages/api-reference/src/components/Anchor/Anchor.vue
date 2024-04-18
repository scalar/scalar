<script setup lang="ts">
import { useClipboard } from '../../hooks'
import ScreenReader from '../ScreenReader.vue'

defineProps<{
  id: string
}>()

const { copyToClipboard } = useClipboard()

const getUrlWithId = (id: string) => {
  const url = new URL(window.location.href)

  url.hash = id

  return url.toString()
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
        #
        <ScreenReader>Copy link to "<slot />"</ScreenReader>
      </button>
    </span>
  </span>
</template>
<style scoped>
.label {
  position: relative;
  display: inline-block;
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

.label:hover .anchor {
  opacity: 1;
}
</style>
