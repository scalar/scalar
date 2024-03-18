<script setup lang="ts">
import { HttpMethod } from '@scalar/api-client'
import { ScalarIcon } from '@scalar/components'
import { type TransformedOperation } from '@scalar/oas-utils'
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
    property="background"
    type="button"
    @click.stop="openClientFor(operation, getGlobalSecurity?.())">
    <span>Test Request</span>
    <ScalarIcon icon="PaperAirplane" />
  </HttpMethod>
</template>
<style scoped>
.show-api-client-button {
  appearance: none;
  outline: none;
  border: none;
  padding: 6px;
  height: 23px;
  white-space: nowrap;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-background-2, var(--default-background-2));
  font-family: var(--theme-font, var(--default-theme-font));
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}
.show-api-client-button span,
.show-api-client-button svg {
  color: #fff;
  z-index: 1;
}
.show-api-client-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  cursor: pointer;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.show-api-client-button:before {
  background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
}
.show-api-client-button:hover:before {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1));
}
.show-api-client-button svg {
  height: 12px;
  width: auto;
  margin-left: 9px;
}
</style>
