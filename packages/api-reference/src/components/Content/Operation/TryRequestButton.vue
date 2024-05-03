<script setup lang="ts">
import { HttpMethod } from '@scalar/api-client'
import { ScalarIcon } from '@scalar/components'
import type { TransformedOperation } from '@scalar/oas-utils'
import { inject } from 'vue'

import { GLOBAL_SECURITY_SYMBOL, openClientFor } from '../../../helpers'

defineProps<{
  operation: TransformedOperation
}>()

const getGlobalSecurity = inject(GLOBAL_SECURITY_SYMBOL)
</script>
<template>
  <HttpMethod
    as="button"
    class="show-api-client-button"
    :method="operation.httpVerb"
    type="button"
    @click.stop="openClientFor(operation, getGlobalSecurity?.())">
    <ScalarIcon icon="PaperAirplane" />
    <span>Test Request</span>
  </HttpMethod>
</template>
<style scoped>
.show-api-client-button {
  appearance: none;
  outline: none;
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
}
.show-api-client-button span,
.show-api-client-button svg {
  color: var(--scalar-button-1-color);
  z-index: 1;
}
.show-api-client-button:hover {
  background: var(--scalar-button-1-hover);
}
.show-api-client-button svg {
  height: 12px;
  width: auto;
  margin-right: 6px;
}
</style>
