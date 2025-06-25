<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'
import { useApiClient } from '@/features/api-client-modal'
import { useConfig } from '@/hooks/useConfig'

const { operation } = defineProps<{
  operation?: Pick<RequestEntity, 'method' | 'path' | 'uid'>
}>()

const { client } = useApiClient()
const config = useConfig()

const isButtonVisible = computed(
  () => config.value.hideTestRequestButton !== true,
)

const handleClick = () => {
  if (operation && client?.value?.open) {
    client.value.open({
      requestUid: operation.uid,
    })
  }
}
</script>
<template>
  <!-- Render the Test Request Button -->
  <button
    v-if="operation && isButtonVisible"
    class="show-api-client-button"
    :method="operation.method"
    type="button"
    @click.stop="handleClick">
    <ScalarIcon
      icon="Play"
      size="sm" />
    <span>Test Request</span>
    <ScreenReader>({{ operation.method }} {{ operation.path }})</ScreenReader>
  </button>
  <!-- Render whitespace, so the container doesn't collapse -->
  <template v-else>&nbsp;</template>
</template>
<style scoped>
.show-api-client-button {
  appearance: none;
  border: none;
  padding: 4px 6px;
  white-space: nowrap;
  border-radius: var(--scalar-radius);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
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
