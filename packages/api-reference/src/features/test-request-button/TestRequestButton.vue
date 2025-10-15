<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { ScalarIconPlay } from '@scalar/icons'
import { emitCustomEvent } from '@scalar/workspace-store/events'
import { ref } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'

const { method, path } = defineProps<{
  method: HttpMethod
  path: string
}>()

const el = ref<HTMLElement | null>(null)
const handleClick = () => {
  emitCustomEvent(el.value, 'scalar-open-client', {})
}
</script>
<template>
  <!-- Render the Test Request Button -->
  <button
    ref="el"
    class="show-api-client-button"
    :method="method"
    type="button"
    @click.stop="handleClick">
    <ScalarIconPlay
      class="size-3"
      weight="fill" />
    <span>Test Request</span>
    <ScreenReader>({{ method }} {{ path }})</ScreenReader>
  </button>
</template>
<style scoped>
.show-api-client-button {
  appearance: none;
  border: none;
  padding: 1px 6px;
  white-space: nowrap;
  border-radius: var(--scalar-radius);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-small);
  line-height: 22px;
  color: var(--scalar-background-2);
  font-family: var(--scalar-font);
  background: var(--scalar-button-1);
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);

  outline-offset: 2px;
}
.show-api-client-button span,
.show-api-client-button svg {
  fill: currentColor;
  color: var(--scalar-button-1-color);
  z-index: 1;
}
.show-api-client-button:hover {
  background: var(--scalar-button-1-hover);
}
.show-api-client-button svg {
  margin-right: 4px;
}
</style>
